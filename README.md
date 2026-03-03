# Brandr

Influencer compliance auditing for brands that work with creators.

<p>
  <a href="https://www.youtube.com/watch?v=8i9XGeD703Y" target="_blank">
    Demo
  </a>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/adba2c0c-5552-477a-82bd-027af0f5194b" width="320"/>
  <img src="https://github.com/user-attachments/assets/24f34bc2-73ee-4987-ad64-6b358b31d5b3" width="320"/>
  <img src="https://github.com/user-attachments/assets/de636064-dcba-4991-8c3b-ca90b2c31549" width="320"/>
  <img src="https://github.com/user-attachments/assets/0f6ce557-cd84-4a0f-877a-34884f62d669" width="320"/>
  <img src="https://github.com/user-attachments/assets/4aff2496-69b9-4769-8db9-cd65b135ae7c" width="320"/>
  <img src="https://github.com/user-attachments/assets/3b9c9b9f-9d5a-4b9e-bbb8-3ee48bf4f35c" width="320"/>
</p>


## The Problem

Startups and growing brands hire lots of creators for UGC campaigns. Once content goes live, you lose control. Did they add the required #ad disclosure? Did they mention a competitor? Did they make claims you never approved?

Right now, someone on your team has to manually watch every post, read every caption, and catch every slip. That doesn't scale when you're working with 50+ creators.

## What Brandr Does

1. Define your campaign rules (brand name, disclosures, competitor keywords, prohibited claims)
2. Add creator handles
3. Brandr scrapes their content, analyzes it with AI, and scores each post
4. Dashboard with flags, scores, and remediation suggestions

## The Web Agents (Via Browser Use Cloud)

This is where it gets interesting. We built AI-powered browser agents that navigate TikTok like a human would.

### Compliance Scraper

Not making API calls. The agent literally opens a browser, visits profiles, clicks through posts, expands captions, takes screenshots. The LLM decides what to do next based on what it sees.

This lets us:
- Extract data that's not available through any API
- Handle dynamic content and popups
- Adapt when TikTok changes their UI
- Capture screenshots as evidence

### Creator Discovery

The find-creators agent taps into something you can't get from any API: TikTok's internal "Suggested accounts" algorithm.

We visit your existing creators, grab TikTok's own recommendations, and surface the ones that keep showing up. You get creator suggestions that are actually relevant to your niche.

## Tech Stack

**Frontend**: Next.js 14, TypeScript, Tailwind, shadcn/ui

**Backend**: Convex, Google Gemini 2.5 Flash, Flask

**Agents**: Browser Use, Python 3.11+, yt-dlp

## Project Structure

```
brandr/
├── app/                    # Next.js frontend
├── convex/                 # Backend functions and schema
└── agents/
    ├── api.py              # Flask API
    ├── tiktok-scraper.py   # Compliance agent
    └── find-creators.py    # Discovery agent
```

## Setup

### Frontend + Convex

```bash
npm install
npx convex dev
npm run dev
```

### Agents

```bash
cd agents
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add BROWSER_USE_API_KEY, GOOGLE_API_KEY
python api.py
```

## API

**POST /scrape** - Audit creators for compliance

**POST /find-creators** - Find similar creators from seeds

## Skills

- Autonomous browser agents with LLMs
- Multimodal AI (text + image)
- Dynamic web scraping
- Real-time sync with Convex
- Full-stack TypeScript/React
