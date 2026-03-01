"""
TikTok Scraper using Browser Use
Runs inside Daytona sandbox

TODO (Person 3): Complete implementation

Output format:
{
    "creatorHandle": "@username",
    "posts": [
        {
            "postUrl": "https://tiktok.com/...",
            "captionText": "...",
            "transcriptText": "..." or null,
            "screenshots": ["base64...", "base64..."],
            "audioSnippetUrl": "..." or null
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
from typing import Optional

# from browser_use import Agent  # TODO: Uncomment when browser-use is installed


async def scrape_creator(handle: str) -> dict:
    """
    Scrape a single TikTok creator's latest posts.

    Args:
        handle: TikTok username (with or without @)

    Returns:
        Dict with creator handle and list of posts
    """
    handle = handle.lstrip("@")
    profile_url = f"https://www.tiktok.com/@{handle}"

    posts = []

    # TODO (Person 3): Implement Browser Use agent
    #
    # Steps:
    # 1. Navigate to profile_url
    # 2. Wait for video grid to load
    # 3. Get first 3-5 video links
    # 4. For each video:
    #    a. Click to open
    #    b. Screenshot the post
    #    c. Expand caption if truncated (click "more")
    #    d. Screenshot expanded caption
    #    e. Extract caption text
    #    f. Play video for 15 seconds
    #    g. Record audio (see record_audio function)
    #    h. Transcribe audio
    #    i. Close video modal
    # 5. Return structured data

    # Placeholder implementation
    posts.append({
        "postUrl": f"{profile_url}/video/placeholder",
        "captionText": "Placeholder caption - implement Browser Use scraping",
        "transcriptText": None,
        "screenshots": [],
        "audioSnippetUrl": None,
    })

    return {
        "creatorHandle": f"@{handle}",
        "posts": posts,
    }


async def record_audio(duration_seconds: int = 15) -> Optional[str]:
    """
    Record system/tab audio for specified duration.

    Returns:
        Path to recorded audio file, or None if recording fails
    """
    # TODO (Person 3): Implement audio recording
    #
    # Options:
    # 1. Use pulseaudio loopback on Linux
    # 2. Use ffmpeg to capture audio stream
    # 3. Use Playwright's video recording and extract audio
    #
    # Example ffmpeg command:
    # ffmpeg -f pulse -i default -t {duration} -acodec pcm_s16le output.wav

    return None


def extract_audio_from_video(video_path: str) -> Optional[str]:
    """
    Extract audio from video file using ffmpeg.

    Args:
        video_path: Path to video file

    Returns:
        Path to extracted audio file, or None if extraction fails
    """
    try:
        audio_path = video_path.replace(".webm", ".wav")
        subprocess.run([
            "ffmpeg", "-i", video_path,
            "-vn",  # No video
            "-acodec", "pcm_s16le",  # WAV format
            "-ar", "16000",  # 16kHz sample rate
            "-ac", "1",  # Mono
            audio_path
        ], check=True, capture_output=True)
        return audio_path
    except subprocess.CalledProcessError:
        return None


async def transcribe_audio(audio_path: str) -> Optional[str]:
    """
    Transcribe audio file using Gemini or Whisper.

    Args:
        audio_path: Path to audio file

    Returns:
        Transcription text, or None if transcription fails
    """
    # TODO (Person 3): Implement transcription
    #
    # Option 1: Gemini API
    # - Read audio file as base64
    # - Send to Gemini with transcription prompt
    #
    # Option 2: OpenAI Whisper API
    # - Send audio file to Whisper endpoint

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None

    # Placeholder - implement actual transcription
    return None


def screenshot_to_base64(screenshot_bytes: bytes) -> str:
    """Convert screenshot bytes to base64 string."""
    return base64.b64encode(screenshot_bytes).decode("utf-8")


async def main(creator_handles: list[str]) -> list[dict]:
    """
    Main entry point for scraping multiple creators.

    Args:
        creator_handles: List of TikTok usernames

    Returns:
        List of creator results
    """
    results = []
    for handle in creator_handles:
        try:
            result = await scrape_creator(handle)
            results.append(result)
        except Exception as e:
            print(f"Error scraping {handle}: {e}")
            results.append({
                "creatorHandle": handle,
                "posts": [],
                "error": str(e),
            })
    return results


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python tiktok-scraper.py handle1 handle2 ...")
        sys.exit(1)

    handles = sys.argv[1:]
    results = asyncio.run(main(handles))
    print(json.dumps(results, indent=2))
