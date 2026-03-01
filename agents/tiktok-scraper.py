"""
TikTok Scraper - Compliance-First Approach

Architecture:
- Browser Use Cloud: navigation (~$1/creator)
- Local/Daytona: yt-dlp downloads, ffmpeg, Gemini transcription

Flow:
1. Scrape ALL posts from creator (no skipping)
2. Download ALL videos, transcribe ALL audio
3. For each post, detect:
   - brandMentioned: keyword found in caption OR transcript
   - disclosureFound: #ad, #sponsored, etc. found
4. Flag compliance issues: brandMentioned=true + disclosureFound=false

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
            "brandMentioned": true,
            "disclosureFound": false,
            "complianceStatus": "VIOLATION",  // or "OK" or "NOT_BRAND_RELATED"
            "detectedKeywords": ["nike", "just do it"],
            "detectedDisclosures": []
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

# Load .env file if it exists (check both current and parent dir)
from pathlib import Path as _Path
from dotenv import load_dotenv
load_dotenv()  # Try current dir first
load_dotenv(_Path(__file__).parent.parent / ".env")  # Then try parent dir (brandr/.env)

from browser_use import Agent, Browser
from browser_use.llm.browser_use import ChatBrowserUse


@dataclass
class BrandConfig:
    brand_name: str
    brand_keywords: list[str]
    disclosure_tokens: list[str]


# Standard disclosure tokens to look for
DEFAULT_DISCLOSURES = [
    "#ad", "#sponsored", "#paidpartnership", "#partner",
    "paid partnership", "sponsored by", "ad:", "advertisement",
    "#brandpartner", "#gifted", "#promo", "#collab"
]


def get_llm():
    api_key = os.environ.get("BROWSER_USE_API_KEY")
    if not api_key:
        raise ValueError("BROWSER_USE_API_KEY environment variable required")
    return ChatBrowserUse(api_key=api_key)


def detect_brand_mentions(text: str, brand_config: BrandConfig) -> list[str]:
    """Return list of brand keywords found in text."""
    if not text:
        return []
    text_lower = text.lower()
    found = []
    for keyword in brand_config.brand_keywords:
        if keyword.lower() in text_lower:
            found.append(keyword)
    return found


def detect_disclosures(text: str, disclosure_tokens: list[str] = None) -> list[str]:
    """Return list of disclosure tokens found in text."""
    if not text:
        return []
    tokens = disclosure_tokens or DEFAULT_DISCLOSURES
    text_lower = text.lower()
    found = []
    for token in tokens:
        if token.lower() in text_lower:
            found.append(token)
    return found


def get_compliance_status(brand_mentioned: bool, disclosure_found: bool) -> str:
    """Determine compliance status."""
    if not brand_mentioned:
        return "NOT_BRAND_RELATED"
    elif brand_mentioned and disclosure_found:
        return "OK"
    else:  # brand_mentioned and not disclosure_found
        return "VIOLATION"


async def analyze_video(video_path: Path, brand_keywords: list[str]) -> dict:
    """
    Analyze video using Gemini - both visual and audio content.
    Returns transcript + visual description + brand detection.
    """
    import httpx

    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[Analyze] No GOOGLE_API_KEY or GEMINI_API_KEY", file=__import__('sys').stderr)
        return {"transcript": None, "visualSummary": None, "error": "No API key"}

    print(f"[Analyze] Using API key: {api_key[:8]}...", file=__import__('sys').stderr)

    try:
        video_data = base64.b64encode(video_path.read_bytes()).decode("utf-8")

        # Determine mime type
        suffix = video_path.suffix.lower()
        mime_type = "video/mp4" if suffix == ".mp4" else "video/webm"

        keywords_str = ", ".join(brand_keywords)

        prompt = f"""Analyze this TikTok video for brand compliance. Provide:

1. TRANSCRIPT: Word-for-word transcription of all spoken words. If no speech, write "NO_SPEECH".

2. VISUAL_SUMMARY: Brief description of what's shown (products, logos, brand items, activities). Focus on anything that could indicate a brand partnership or sponsorship.

3. BRAND_MENTIONS: List any mentions of these brand keywords (spoken OR visual): {keywords_str}

4. DISCLOSURE_CHECK: Note if you see/hear any ad disclosures (#ad, #sponsored, "paid partnership", etc.)

Format your response as JSON:
{{
    "transcript": "exact spoken words here",
    "visualSummary": "description of visual content",
    "brandMentions": ["keyword1", "keyword2"],
    "disclosuresFound": ["#ad"],
    "potentialSponsoredContent": true/false,
    "reasoning": "why you think this might be sponsored"
}}"""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
                json={
                    "contents": [{
                        "parts": [
                            {"text": prompt},
                            {"inline_data": {"mime_type": mime_type, "data": video_data}}
                        ]
                    }]
                },
                timeout=180.0  # Longer timeout for video processing
            )

            if response.status_code == 200:
                data = response.json()
                result_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

                # Try to parse as JSON
                try:
                    # Find JSON in response
                    json_start = result_text.find('{')
                    json_end = result_text.rfind('}') + 1
                    if json_start != -1 and json_end > json_start:
                        return json.loads(result_text[json_start:json_end])
                except json.JSONDecodeError:
                    pass

                # Fallback: return raw text
                return {
                    "transcript": result_text,
                    "visualSummary": None,
                    "brandMentions": [],
                    "disclosuresFound": [],
                    "potentialSponsoredContent": False,
                    "reasoning": "Could not parse structured response"
                }
            else:
                error_msg = f"API error: {response.status_code}"
                try:
                    error_body = response.json()
                    print(f"[Analyze] {error_msg}: {error_body}", file=__import__('sys').stderr)
                except:
                    print(f"[Analyze] {error_msg}: {response.text[:200]}", file=__import__('sys').stderr)
                return {"transcript": None, "error": error_msg}

    except Exception as e:
        print(f"[Analyze] Error: {e}", file=__import__('sys').stderr)
        return {"transcript": None, "error": str(e)}


async def transcribe_audio(audio_path: Path) -> Optional[str]:
    """Fallback: Transcribe audio only using Gemini."""
    import httpx

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None

    try:
        audio_data = base64.b64encode(audio_path.read_bytes()).decode("utf-8")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
                json={
                    "contents": [{
                        "parts": [
                            {"text": "Transcribe this audio. Return only spoken words, or 'NO_SPEECH' if silent."},
                            {"inline_data": {"mime_type": "audio/wav", "data": audio_data}}
                        ]
                    }]
                },
                timeout=120.0
            )

            if response.status_code == 200:
                data = response.json()
                result = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return "" if result == "NO_SPEECH" else result
    except Exception as e:
        print(f"[Transcribe] Error: {e}", file=__import__('sys').stderr)

    return None


def parse_posts_json(text: str) -> list[dict]:
    """Parse JSON array of posts from agent response."""
    if not text:
        return []

    # First, try to unescape if the JSON has escaped quotes
    if '\\"' in text:
        try:
            text = text.replace('\\"', '"')
        except Exception:
            pass

    # Try direct parse first
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
        start = text.find('{')
        if start == -1:
            return []
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


async def download_and_analyze(url: str, work_dir: Path, index: int, brand_keywords: list[str]) -> dict:
    """Download video and analyze with Gemini (visual + audio)."""
    result = {
        "transcript": None,
        "visualSummary": None,
        "brandMentions": [],
        "disclosuresFound": [],
        "potentialSponsoredContent": False,
        "reasoning": None,
        "error": None,
    }

    if not url:
        result["error"] = "No URL"
        return result

    print(f"[Post {index + 1}] Downloading video...", file=__import__('sys').stderr)
    video_path = work_dir / f"video_{index}.mp4"

    try:
        # Download video with yt-dlp
        dl_result = subprocess.run([
            "yt-dlp", "-f", "best[ext=mp4]/best",
            "-o", str(video_path),
            "--no-playlist",
            "--quiet",
            url
        ], capture_output=True, timeout=90)

        if dl_result.returncode != 0 or not video_path.exists():
            stderr = dl_result.stderr.decode()[:200] if dl_result.stderr else "unknown error"
            print(f"[Post {index + 1}] yt-dlp failed: {stderr}", file=__import__('sys').stderr)
            result["error"] = f"Download failed: {stderr}"
            return result

        # Check file size (Gemini has limits)
        file_size_mb = video_path.stat().st_size / (1024 * 1024)
        print(f"[Post {index + 1}] Downloaded ({file_size_mb:.1f}MB), analyzing with Gemini...", file=__import__('sys').stderr)

        if file_size_mb > 20:
            print(f"[Post {index + 1}] Video too large ({file_size_mb:.1f}MB > 20MB), falling back to audio", file=__import__('sys').stderr)
            # Fall back to audio-only for large videos
            audio_path = work_dir / f"audio_{index}.wav"
            subprocess.run([
                "ffmpeg", "-y", "-i", str(video_path),
                "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
                str(audio_path)
            ], capture_output=True, timeout=60)
            if audio_path.exists():
                transcript = await transcribe_audio(audio_path)
                result["transcript"] = transcript
            return result

        # Analyze video with Gemini
        analysis = await analyze_video(video_path, brand_keywords)

        result["transcript"] = analysis.get("transcript")
        result["visualSummary"] = analysis.get("visualSummary")
        result["brandMentions"] = analysis.get("brandMentions", [])
        result["disclosuresFound"] = analysis.get("disclosuresFound", [])
        result["potentialSponsoredContent"] = analysis.get("potentialSponsoredContent", False)
        result["reasoning"] = analysis.get("reasoning")

        if result["transcript"]:
            preview = result["transcript"][:60] + "..." if len(result["transcript"]) > 60 else result["transcript"]
            print(f"[Post {index + 1}] Transcript: {preview}", file=__import__('sys').stderr)
        if result["visualSummary"]:
            preview = result["visualSummary"][:60] + "..." if len(result["visualSummary"]) > 60 else result["visualSummary"]
            print(f"[Post {index + 1}] Visual: {preview}", file=__import__('sys').stderr)

    except subprocess.TimeoutExpired:
        result["error"] = "Download timeout"
        print(f"[Post {index + 1}] Timeout", file=__import__('sys').stderr)
    except FileNotFoundError as e:
        result["error"] = f"Missing tool: {e}"
        print(f"[Post {index + 1}] Missing tool: {e}", file=__import__('sys').stderr)
    except Exception as e:
        result["error"] = str(e)
        print(f"[Post {index + 1}] Error: {e}", file=__import__('sys').stderr)

    return result


async def scrape_creator(
    handle: str,
    brand_config: BrandConfig,
    num_posts: int = 3,
) -> dict:
    """
    Scrape creator's posts - COMPLIANCE FIRST approach.
    Downloads and analyzes ALL posts, then checks for compliance.
    """
    handle = handle.lstrip("@")
    profile_url = f"https://www.tiktok.com/@{handle}"
    work_dir = Path(tempfile.mkdtemp())

    print(f"\n{'='*60}", file=__import__('sys').stderr)
    print(f"Scraping @{handle} ({num_posts} posts) - COMPLIANCE MODE", file=__import__('sys').stderr)
    print(f"Brand: {brand_config.brand_name}", file=__import__('sys').stderr)
    print(f"Keywords: {brand_config.brand_keywords}", file=__import__('sys').stderr)
    print(f"{'='*60}", file=__import__('sys').stderr)

    posts_data = []

    # Single cloud browser session
    browser = Browser(
        headless=False,
        disable_security=True,
        use_cloud=True,
    )

    try:
        llm = get_llm()

        task = f"""
Go to {profile_url}

Extract URLs from the first {num_posts} videos on this TikTok profile.

Steps:
1. Wait for profile page to load (video thumbnails visible)
2. Click on the FIRST video thumbnail
3. For each video (total {num_posts}):
   a. Get the URL from the address bar - THIS IS REQUIRED
   b. Try to get caption text (if visible, otherwise leave empty)
   c. Try to get view/like counts (if visible)
   d. Press DOWN ARROW key to go to next video
   e. Wait briefly for next video
4. Return data as JSON

PRIORITY: URLs are most important. Don't spend too many steps trying to extract captions - if not easily visible, move on.

Return format (JSON array):
[
  {{"url": "https://tiktok.com/@user/video/123", "caption": "caption text or empty", "views": "1.2M", "likes": "50K"}},
  ...
]
"""

        print(f"[Browser] Starting extraction...", file=__import__('sys').stderr)

        agent = Agent(
            task=task,
            llm=llm,
            browser=browser,
            use_vision=False,
            step_timeout=300,
            max_failures=5,
            max_steps=20,  # Prevent infinite loops
        )

        agent_result = await agent.run()

        if agent_result:
            result_text = agent_result.final_result()
            if not result_text:
                extracted = agent_result.extracted_content()
                if extracted:
                    result_text = extracted[-1]
                else:
                    result_text = str(agent_result)

            print(f"[Browser] Agent returned: {result_text[:300]}...", file=__import__('sys').stderr)
            posts_data = parse_posts_json(result_text)
            print(f"[Browser] Parsed {len(posts_data)} posts", file=__import__('sys').stderr)

    except Exception as e:
        print(f"[Browser] Error: {e}", file=__import__('sys').stderr)

    finally:
        print(f"[Browser] Closing...", file=__import__('sys').stderr)
        await browser.stop()

    # Process ALL posts - download and analyze with Gemini (visual + audio)
    posts = []
    for i, post_data in enumerate(posts_data[:num_posts]):
        url = post_data.get("url", "")
        caption = post_data.get("caption", "")

        print(f"\n[Post {i + 1}] Processing...", file=__import__('sys').stderr)

        # Download and analyze video (visual + audio)
        analysis = await download_and_analyze(url, work_dir, i, brand_config.brand_keywords)

        # Combine all text sources for keyword detection
        combined_text = f"{caption} {analysis.get('transcript') or ''} {analysis.get('visualSummary') or ''}"

        # Detect brand mentions from: caption + transcript + visual + Gemini's detection
        detected_keywords = detect_brand_mentions(combined_text, brand_config)
        # Also add any brand mentions Gemini found visually
        gemini_brand_mentions = analysis.get("brandMentions", [])
        for mention in gemini_brand_mentions:
            if mention not in detected_keywords:
                detected_keywords.append(mention)

        # Detect disclosures from: caption + transcript + Gemini's detection
        detected_disclosures = detect_disclosures(combined_text, brand_config.disclosure_tokens)
        # Also add any disclosures Gemini found
        gemini_disclosures = analysis.get("disclosuresFound", [])
        for disc in gemini_disclosures:
            if disc not in detected_disclosures:
                detected_disclosures.append(disc)

        # Determine compliance status
        brand_mentioned = len(detected_keywords) > 0 or analysis.get("potentialSponsoredContent", False)
        disclosure_found = len(detected_disclosures) > 0
        compliance_status = get_compliance_status(brand_mentioned, disclosure_found)

        post = {
            "postUrl": url,
            "captionText": caption,
            "transcriptText": analysis.get("transcript"),
            "visualSummary": analysis.get("visualSummary"),
            "viewCount": post_data.get("views", ""),
            "likeCount": post_data.get("likes", ""),
            "brandMentioned": brand_mentioned,
            "disclosureFound": disclosure_found,
            "complianceStatus": compliance_status,
            "detectedKeywords": detected_keywords,
            "detectedDisclosures": detected_disclosures,
            "potentialSponsoredContent": analysis.get("potentialSponsoredContent", False),
            "aiReasoning": analysis.get("reasoning"),
        }

        status_emoji = {"OK": "✅", "VIOLATION": "🚨", "NOT_BRAND_RELATED": "⚪"}
        print(f"[Post {i + 1}] {status_emoji.get(compliance_status, '?')} {compliance_status}", file=__import__('sys').stderr)
        if detected_keywords:
            print(f"[Post {i + 1}]   Keywords found: {detected_keywords}", file=__import__('sys').stderr)
        if detected_disclosures:
            print(f"[Post {i + 1}]   Disclosures found: {detected_disclosures}", file=__import__('sys').stderr)
        if analysis.get("potentialSponsoredContent"):
            print(f"[Post {i + 1}]   AI flagged as potential sponsored content", file=__import__('sys').stderr)

        posts.append(post)

    # Summary
    violations = sum(1 for p in posts if p["complianceStatus"] == "VIOLATION")
    ok_posts = sum(1 for p in posts if p["complianceStatus"] == "OK")
    not_related = sum(1 for p in posts if p["complianceStatus"] == "NOT_BRAND_RELATED")

    print(f"\n{'='*60}", file=__import__('sys').stderr)
    print(f"COMPLIANCE SUMMARY for @{handle}:", file=__import__('sys').stderr)
    print(f"  🚨 Violations: {violations}", file=__import__('sys').stderr)
    print(f"  ✅ Compliant: {ok_posts}", file=__import__('sys').stderr)
    print(f"  ⚪ Not brand-related: {not_related}", file=__import__('sys').stderr)
    print(f"{'='*60}\n", file=__import__('sys').stderr)

    return {
        "creatorHandle": f"@{handle}",
        "posts": posts,
        "summary": {
            "totalPosts": len(posts),
            "violations": violations,
            "compliant": ok_posts,
            "notBrandRelated": not_related,
        }
    }


async def main(
    creator_handles: list[str],
    brand_name: str = "TestBrand",
    brand_keywords: list[str] = None,
    disclosure_tokens: list[str] = None,
    num_posts: int = 3,
) -> list[dict]:
    brand_config = BrandConfig(
        brand_name=brand_name,
        brand_keywords=brand_keywords or [brand_name.lower()],
        disclosure_tokens=disclosure_tokens or DEFAULT_DISCLOSURES,
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

    parser = argparse.ArgumentParser(description="TikTok Brand Compliance Scraper")
    parser.add_argument("handles", nargs="+", help="TikTok handles to scrape")
    parser.add_argument("--brand", default="TestBrand", help="Brand name")
    parser.add_argument("--keywords", nargs="*", help="Brand keywords to detect")
    parser.add_argument("--disclosures", nargs="*", help="Custom disclosure tokens (default: #ad, #sponsored, etc.)")
    parser.add_argument("--posts", type=int, default=3, help="Number of posts (default: 3)")

    args = parser.parse_args()

    results = asyncio.run(main(
        creator_handles=args.handles,
        brand_name=args.brand,
        brand_keywords=args.keywords,
        disclosure_tokens=args.disclosures,
        num_posts=args.posts,
    ))

    print(json.dumps(results, indent=2))
