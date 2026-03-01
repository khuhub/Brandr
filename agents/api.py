"""
Agents API - Flask server that Convex calls to run agents.

Usage:
    python api.py  # runs on port 8080

Convex calls:
    POST /scrape { "creatorHandles": ["@user"], "brand": "Nike", "keywords": ["nike"] }
"""

import asyncio
import json
import os
import sys
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)


@app.route("/scrape", methods=["POST"])
def scrape():
    """
    Scrape TikTok creators for brand compliance.

    Request:
        {
            "creatorHandles": ["@charlidamelio", "@mrbeast"],
            "brand": "Nike",
            "keywords": ["nike", "swoosh"],
            "posts": 3
        }

    Response:
        [
            {
                "creatorHandle": "@charlidamelio",
                "posts": [...],
                "summary": {...}
            }
        ]
    """
    from importlib import import_module

    # Import the scraper module
    scraper = import_module("tiktok-scraper")

    data = request.json or {}
    handles = data.get("creatorHandles", [])
    brand = data.get("brand", "Brand")
    keywords = data.get("keywords", [brand.lower()])
    posts = data.get("posts", 3)

    if not handles:
        return jsonify({"error": "No creatorHandles provided"}), 400

    try:
        results = asyncio.run(scraper.main(
            creator_handles=handles,
            brand_name=brand,
            brand_keywords=keywords,
            num_posts=posts,
        ))
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/find-creators", methods=["POST"])
def find_creators():
    """
    Find similar creators based on seed handles.

    Request:
        {
            "seedHandles": ["@charlidamelio", "@addisonre"],
            "limit": 9,
            "topCandidates": 12
        }

    Response (minimal, UI-ready):
        [
            {
                "username": "@creator",
                "followerCount": "82.4K",
                "matchPercent": 92,
                "matchLabel": "Top Match"
            }
        ]
    """
    # Import dynamically to avoid circular imports
    import importlib.util
    spec = importlib.util.spec_from_file_location("find_creators", "find-creators.py")
    find_creators_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(find_creators_module)

    data = request.json or {}
    seed_handles = data.get("seedHandles", [])
    limit = data.get("limit", 4)

    if not seed_handles or len(seed_handles) < 2:
        return jsonify({"error": "Need at least 2 seedHandles"}), 400

    try:
        results = asyncio.run(find_creators_module.find_similar_creators(
            seed_handles=seed_handles,
            limit=limit,
        ))
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting agents API on port {port}...")
    print(f"Endpoints:")
    print(f"  POST /scrape         - Run TikTok compliance scraper")
    print(f"  POST /find-creators  - Find similar creators")
    print(f"  GET  /health         - Health check")
    app.run(host="0.0.0.0", port=port, debug=True)
