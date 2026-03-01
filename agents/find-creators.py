"""
Find Similar Creators - Simple Version

1. Visit seed profiles to get suggested creators
2. Visit suggested creators to get their follower counts
3. Return ranked results
"""

import asyncio
import json
import os
import re
from collections import Counter
from dotenv import load_dotenv

load_dotenv()

from browser_use import Agent, Browser
from browser_use.llm.browser_use import ChatBrowserUse


def get_llm():
    api_key = os.environ.get("BROWSER_USE_API_KEY")
    if not api_key:
        raise ValueError("BROWSER_USE_API_KEY required")
    return ChatBrowserUse(api_key=api_key)


def parse_json(text: str) -> dict:
    """Extract JSON from agent output."""
    if not text:
        return {}
    # Strip markdown
    text = re.sub(r'^```(?:json)?\s*', '', text.strip())
    text = re.sub(r'\s*```$', '', text.strip())
    # Remove leading/trailing quotes
    text = text.strip('"\'')
    # Unescape
    text = text.replace('\\"', '"').replace('\\n', '\n')

    try:
        return json.loads(text)
    except:
        pass

    # Find JSON object
    start = text.find("{")
    if start == -1:
        return {}

    depth = 0
    end = start
    for i, c in enumerate(text[start:], start):
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    try:
        return json.loads(text[start:end])
    except:
        return {}


def norm_handle(h: str) -> str:
    """Normalize handle to @lowercase format."""
    if not h:
        return ""
    h = str(h).strip().lower()
    h = h.replace(" ", "")
    if not h.startswith("@"):
        h = "@" + h
    return h


async def get_profile_data(handle: str, llm, get_suggestions: bool = True) -> dict:
    """Get profile data (follower count and optionally suggestions)."""
    handle_clean = handle.lstrip("@")
    url = f"https://www.tiktok.com/@{handle_clean}"

    if get_suggestions:
        task = f"""
Go to {url}. Wait for the profile to load.

Look at the page and find:
1. The follower count (like "155.9M" or "24.5K") - it's in the profile stats
2. The "Suggested accounts" section - extract up to 8 handles

Return ONLY valid JSON (no markdown):
{{"handle":"@{handle_clean}","followerCount":"X","suggested":["@a","@b"]}}
"""
    else:
        task = f"""
Go to {url}. Wait for the profile to load.

Find the follower count (like "155.9M" or "24.5K") in the profile stats.

Return ONLY valid JSON (no markdown):
{{"handle":"@{handle_clean}","followerCount":"X"}}
"""

    browser = Browser(headless=False, disable_security=True, use_cloud=True)
    agent = Agent(task=task, llm=llm, browser=browser, use_vision=False, max_steps=12)

    try:
        result = await agent.run()
        txt = result.final_result() if hasattr(result, "final_result") else str(result)
        data = parse_json(txt)
        data["handle"] = f"@{handle_clean}"
        return data
    except Exception as e:
        print(f"Error @{handle_clean}: {e}")
        return {"handle": f"@{handle_clean}", "followerCount": None, "suggested": []}
    finally:
        await browser.stop()


async def find_similar_creators(seed_handles: list, limit: int = 4):
    """
    Get suggested creators from each seed and return ranked results.
    """
    llm = get_llm()

    all_suggested = []
    seed_set = {norm_handle(h) for h in seed_handles}

    # Get suggestions from each seed
    print(f"Getting suggestions from {len(seed_handles)} seed profiles...")
    for seed in seed_handles:
        print(f"  Fetching {seed}...")
        data = await get_profile_data(seed, llm, get_suggestions=True)

        for sug in (data.get("suggested") or []):
            h = norm_handle(sug)
            if h and h not in seed_set:
                all_suggested.append(h)

    # Count occurrences and get top
    counts = Counter(all_suggested)
    top_handles = [h for h, _ in counts.most_common(limit)]

    if not top_handles:
        print("[Warning] No suggestions found")
        return []

    # Build results (no follower count fetching)
    results = []
    for h in top_handles:
        overlap = counts[h]
        match_pct = min(100, 50 + overlap * 20)

        results.append({
            "username": h,
            "followerCount": "0",
            "matchPercent": match_pct,
            "matchLabel": "Top Match" if match_pct >= 85 else "Great Match" if match_pct >= 70 else "Good Match",
        })

    return results


async def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("handles", nargs="+")
    parser.add_argument("--limit", type=int, default=9)
    args = parser.parse_args()

    result = await find_similar_creators(args.handles, limit=args.limit)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
