"""
TikTok Scraper using Browser Use - Single Session Approach

Cost-optimized: ~$1 per creator (single cloud browser session)
- Opens profile, clicks first video
- Uses down arrow to navigate between posts
- Extracts all URLs/captions in one session
- Downloads videos with yt-dlp after browser closes

Output format:
{
    "creatorHandle": "@username",
    "posts": [
        {
            "postUrl": "https://tiktok.com/...",
            "captionText": "...",
            "transcriptText": "...",
            "viewCount": "1.2M",
            "likeCount": "50K",
            "screenshots": ["base64..."],
            "isBrandRelated": true/false
        }
    ]
}
"""

import asyncio
import base64
import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

from browser_use import Agent, Browser
from browser_use.llm.browser_use import ChatBrowserUse


@dataclass
class BrandConfig:
    brand_name: str
    brand_keywords: list[str]
    disclosure_tokens: list[str]


def get_llm():
    api_key = os.environ.get("BROWSER_USE_API_KEY")
    if not api_key:
        raise ValueError("BROWSER_USE_API_KEY environment variable required")
    return ChatBrowserUse(api_key=api_key)


def is_brand_related(text: str, brand_config: BrandConfig) -> bool:
    if not text:
        return False
    text_lower = text.lower()
    for keyword in brand_config.brand_keywords:
        if keyword.lower() in text_lower:
            return True
    return False


async def transcribe_audio(audio_path: Path) -> Optional[str]:
    """Transcribe audio using Gemini."""
    import httpx

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("[Transcribe] No GOOGLE_API_KEY", file=__import__('sys').stderr)
        return None

    try:
        audio_data = base64.b64encode(audio_path.read_bytes()).decode("utf-8")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}",
                json={
                    "contents": [{
                        "parts": [
                            {"text": "Transcribe this audio from a TikTok video. Return only the spoken words, nothing else."},
                            {"inline_data": {"mime_type": "audio/wav", "data": audio_data}}
                        ]
                    }]
                },
                timeout=120.0
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            else:
                print(f"[Transcribe] API error: {response.status_code}", file=__import__('sys').stderr)
    except Exception as e:
        print(f"[Transcribe] Error: {e}", file=__import__('sys').stderr)

    return None


def parse_posts_json(text: str) -> list[dict]:
    """Parse JSON array of posts from agent response."""
    if not text:
        return []

    # First, try to unescape if the JSON has escaped quotes
    # This handles cases like: [{\"url\": \"...\"}]
    if '\\"' in text:
        try:
            # The text might be a JSON string containing JSON
            # Try to decode the escaped quotes
            text = text.replace('\\"', '"')
        except Exception:
            pass

    # Try direct parse first (cleanest case)
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        elif isinstance(parsed, dict):
            return [parsed]
    except json.JSONDecodeError:
        pass

    # Find the JSON array
    start = text.find('[')
    if start == -1:
        # Try finding single object
        start = text.find('{')
        if start == -1:
            return []
        # Wrap single object in array
        text = text[start:]
        bracket_count = 0
        end = 0
        for i, char in enumerate(text):
            if char == '{':
                bracket_count += 1
            elif char == '}':
                bracket_count -= 1
                if bracket_count == 0:
                    end = i + 1
                    break
        if end > 0:
            try:
                return [json.loads(text[:end])]
            except json.JSONDecodeError:
                return []
        return []

    # Find matching closing bracket
    text = text[start:]
    bracket_count = 0
    end = 0
    for i, char in enumerate(text):
        if char == '[':
            bracket_count += 1
        elif char == ']':
            bracket_count -= 1
            if bracket_count == 0:
                end = i + 1
                break

    if end > 0:
        try:
            return json.loads(text[:end])
        except json.JSONDecodeError:
            return []
    return []


async def download_and_transcribe(post: dict, work_dir: Path, index: int) -> Optional[str]:
    """Download video and transcribe audio."""
    url = post.get("postUrl", "")
    if not url:
        return None

    print(f"[Post {index + 1}] Downloading video...", file=__import__('sys').stderr)
    video_path = work_dir / f"video_{index}.mp4"
    audio_path = work_dir / f"audio_{index}.wav"

    try:
        # Download video with yt-dlp
        dl_result = subprocess.run([
            "yt-dlp", "-f", "best[ext=mp4]/best",
            "-o", str(video_path),
            "--no-playlist",
            "--quiet",
            url
        ], capture_output=True, timeout=60)

        if dl_result.returncode != 0 or not video_path.exists():
            print(f"[Post {index + 1}] yt-dlp failed: {dl_result.stderr.decode()[:100]}", file=__import__('sys').stderr)
            return None

        print(f"[Post {index + 1}] Extracting audio...", file=__import__('sys').stderr)

        # Extract audio with ffmpeg
        subprocess.run([
            "ffmpeg", "-y", "-i", str(video_path),
            "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
            str(audio_path)
        ], check=True, capture_output=True, timeout=60)

        if audio_path.exists() and audio_path.stat().st_size > 1000:
            print(f"[Post {index + 1}] Transcribing...", file=__import__('sys').stderr)
            transcript = await transcribe_audio(audio_path)
            if transcript:
                print(f"[Post {index + 1}] Transcript: {transcript[:80]}...", file=__import__('sys').stderr)
            return transcript

    except subprocess.TimeoutExpired:
        print(f"[Post {index + 1}] Timeout", file=__import__('sys').stderr)
    except subprocess.CalledProcessError as e:
        print(f"[Post {index + 1}] FFmpeg error: {e}", file=__import__('sys').stderr)
    except FileNotFoundError:
        print(f"[Post {index + 1}] yt-dlp not installed", file=__import__('sys').stderr)

    return None


async def scrape_creator(
    handle: str,
    brand_config: BrandConfig,
    num_posts: int = 3,
) -> dict:
    """
    Scrape creator's posts using SINGLE browser session (~$1 cost).
    Uses down arrow to navigate between posts.
    """
    handle = handle.lstrip("@")
    profile_url = f"https://www.tiktok.com/@{handle}"
    work_dir = Path(tempfile.mkdtemp())

    print(f"\n{'='*60}", file=__import__('sys').stderr)
    print(f"Scraping @{handle} ({num_posts} posts)", file=__import__('sys').stderr)
    print(f"Brand: {brand_config.brand_name}", file=__import__('sys').stderr)
    print(f"Keywords: {brand_config.brand_keywords}", file=__import__('sys').stderr)
    print(f"{'='*60}", file=__import__('sys').stderr)

    posts_data = []

    # Single cloud browser session for all posts
    browser = Browser(
        headless=False,
        disable_security=True,
        use_cloud=True,
    )

    try:
        llm = get_llm()

        # Agent task: navigate through all posts in one session
        task = f"""
Go to {profile_url}

Your task is to extract info from the first {num_posts} videos on this TikTok profile.

Steps:
1. Wait for the profile page to load (you should see video thumbnails)
2. Click on the FIRST video thumbnail to open it
3. For each video (total {num_posts} videos):
   a. Wait for the video to load
   b. Extract the current URL from the browser address bar
   c. Extract the caption/description text (click "more" if truncated)
   d. Extract the view count (e.g., "1.2M views")
   e. Extract the like count (e.g., "50K likes")
   f. Press the DOWN ARROW key or click the down button to go to the next video
   g. Wait a moment for the next video to load
4. After extracting all {num_posts} videos, return the data

IMPORTANT: Use the down arrow key or the down navigation button (usually visible on the right side) to move to the next video. Do NOT go back to the profile page.

Return format (JSON array):
[
  {{"url": "https://tiktok.com/@user/video/123", "caption": "...", "views": "1.2M", "likes": "50K"}},
  {{"url": "https://tiktok.com/@user/video/456", "caption": "...", "views": "800K", "likes": "30K"}},
  ...
]
"""

        print(f"[Browser] Starting single-session extraction...", file=__import__('sys').stderr)

        agent = Agent(
            task=task,
            llm=llm,
            browser=browser,
            use_vision=False,
            step_timeout=300,  # Longer timeout for multi-post extraction
            max_failures=5,
        )

        agent_result = await agent.run()

        # Parse result
        if agent_result:
            result_text = agent_result.final_result()
            if not result_text:
                extracted = agent_result.extracted_content()
                if extracted:
                    result_text = extracted[-1]
                else:
                    result_text = str(agent_result)

            print(f"[Browser] Agent returned: {result_text[:300]}...", file=__import__('sys').stderr)

            # Parse the JSON array
            posts_data = parse_posts_json(result_text)
            print(f"[Browser] Parsed {len(posts_data)} posts", file=__import__('sys').stderr)

        # Take a final screenshot
        try:
            page = await browser.get_current_page()
            if page:
                ss_path = work_dir / "final_screenshot.png"
                await page.screenshot(path=str(ss_path))
                print(f"[Browser] Screenshot saved", file=__import__('sys').stderr)
        except Exception as e:
            print(f"[Browser] Screenshot failed: {e}", file=__import__('sys').stderr)

    except Exception as e:
        print(f"[Browser] Error: {e}", file=__import__('sys').stderr)

    finally:
        print(f"[Browser] Closing...", file=__import__('sys').stderr)
        await browser.stop()

    # Now process the extracted data
    posts = []
    for i, post_data in enumerate(posts_data[:num_posts]):
        post = {
            "postUrl": post_data.get("url", ""),
            "captionText": post_data.get("caption", ""),
            "transcriptText": None,
            "viewCount": post_data.get("views", ""),
            "likeCount": post_data.get("likes", ""),
            "screenshots": [],
            "isBrandRelated": False,
            "error": None,
        }

        # Check brand relevance based on caption
        post["isBrandRelated"] = is_brand_related(post["captionText"], brand_config)

        # Only download/transcribe if brand-related
        if post["isBrandRelated"] and post["postUrl"]:
            transcript = await download_and_transcribe(post, work_dir, i)
            if transcript:
                post["transcriptText"] = transcript
                # Re-check with transcript
                combined = f"{post['captionText']} {transcript}"
                post["isBrandRelated"] = is_brand_related(combined, brand_config)
        elif not post["isBrandRelated"]:
            print(f"[Post {i + 1}] Skipping download (not brand-related)", file=__import__('sys').stderr)

        posts.append(post)

    # Summary
    brand_posts = sum(1 for p in posts if p.get("isBrandRelated"))
    transcribed = sum(1 for p in posts if p.get("transcriptText"))

    print(f"\n{'='*60}", file=__import__('sys').stderr)
    print(f"DONE: {len(posts)} posts extracted, {brand_posts} brand-related, {transcribed} transcribed", file=__import__('sys').stderr)
    print(f"{'='*60}\n", file=__import__('sys').stderr)

    return {
        "creatorHandle": f"@{handle}",
        "posts": posts,
    }


async def main(
    creator_handles: list[str],
    brand_name: str = "TestBrand",
    brand_keywords: list[str] = None,
    num_posts: int = 3,
) -> list[dict]:
    brand_config = BrandConfig(
        brand_name=brand_name,
        brand_keywords=brand_keywords or [brand_name.lower()],
        disclosure_tokens=["#ad", "#sponsored", "paid partnership"],
    )

    results = []
    for handle in creator_handles:
        try:
            result = await scrape_creator(handle, brand_config, num_posts)
            results.append(result)
        except Exception as e:
            print(f"Error scraping {handle}: {e}", file=__import__('sys').stderr)
            results.append({
                "creatorHandle": handle,
                "posts": [],
                "error": str(e),
            })

    return results


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="TikTok Brand Scraper")
    parser.add_argument("handles", nargs="+", help="TikTok handles to scrape")
    parser.add_argument("--brand", default="TestBrand", help="Brand name")
    parser.add_argument("--keywords", nargs="*", help="Brand keywords to detect")
    parser.add_argument("--posts", type=int, default=3, help="Number of posts (default: 3)")

    args = parser.parse_args()

    results = asyncio.run(main(
        creator_handles=args.handles,
        brand_name=args.brand,
        brand_keywords=args.keywords,
        num_posts=args.posts,
    ))

    print(json.dumps(results, indent=2))
