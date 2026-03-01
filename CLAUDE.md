# BrandGuard - Implementation Plan

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Convex (database, real-time, server functions)
- **Browser Automation**: Daytona Sandbox + Browser Use
- **AI**: Gemini API (VLM for screenshots, embeddings for alignment)
- **Deployment**: Vercel (frontend) + Convex Cloud (backend)

## Project Structure
```
brandr/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Campaign setup (Page 1)
│   ├── dashboard/
│   │   └── page.tsx       # Audit dashboard (Page 2)
│   ├── creator/
│   │   └── [id]/
│   │       └── page.tsx   # Creator detail (Page 3)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── campaign-form.tsx
│   ├── audit-table.tsx
│   ├── creator-card.tsx
│   ├── risk-badge.tsx
│   └── email-draft.tsx
├── convex/
│   ├── schema.ts          # Data model
│   ├── campaigns.ts       # Campaign mutations/queries
│   ├── audits.ts          # Audit mutations/queries
│   ├── findings.ts        # Findings queries
│   ├── actions/
│   │   ├── runAudit.ts    # Orchestrator action
│   │   ├── scoring.ts     # Alignment + risk scoring
│   │   └── gemini.ts      # Gemini API calls
│   └── _generated/
├── lib/
│   ├── utils.ts
│   └── types.ts
├── daytona/
│   ├── tiktok-scraper.py  # Browser Use script
│   └── requirements.txt
├── .env.local             # Frontend env vars
├── .env                   # Shared env vars
├── convex.json
├── package.json
└── CLAUDE.md
```

---

## Work Split (2-3 People)

### Person 1: Frontend (UI/UX)
**Focus**: All React components and pages

#### Tasks:
1. [ ] Initialize Next.js project with TypeScript + Tailwind
2. [ ] Install and configure shadcn/ui
3. [ ] Create layout with navigation
4. [ ] **Page 1 - Campaign Setup**
   - [ ] Campaign form component (all fields from PRD)
   - [ ] Form validation
   - [ ] Submit button triggers audit
5. [ ] **Page 2 - Dashboard**
   - [ ] Audit status header (running/done/failed)
   - [ ] Creator table with columns: Creator, Alignment, Risk, Flags, Action
   - [ ] Sortable columns
   - [ ] Click row → navigate to detail
6. [ ] **Page 3 - Creator Detail**
   - [ ] Caption display
   - [ ] Transcript excerpt
   - [ ] Screenshot gallery
   - [ ] Risk breakdown component
   - [ ] Email draft with copy button
7. [ ] Loading states and error handling
8. [ ] Connect to Convex queries/mutations (after Person 2 is done)

**Can start immediately with mock data**

---

### Person 2: Backend (Convex)
**Focus**: Data model, mutations, queries, scoring logic

#### Tasks:
1. [ ] Initialize Convex project (`npx convex dev`)
2. [ ] **Schema** (`convex/schema.ts`)
   - [ ] campaigns table
   - [ ] audits table
   - [ ] auditFindings table
3. [ ] **Campaigns** (`convex/campaigns.ts`)
   - [ ] `createCampaign` mutation
   - [ ] `getCampaign` query
   - [ ] `listCampaigns` query
4. [ ] **Audits** (`convex/audits.ts`)
   - [ ] `createAudit` mutation
   - [ ] `updateAuditStatus` mutation
   - [ ] `getAudit` query
   - [ ] `getAuditByCampaign` query
5. [ ] **Findings** (`convex/findings.ts`)
   - [ ] `createFinding` mutation
   - [ ] `getFindingsByAudit` query
   - [ ] `getFinding` query
6. [ ] **Scoring Logic** (`convex/actions/scoring.ts`)
   - [ ] Risk score calculation (disclosure, competitor, prohibited claims)
   - [ ] Alignment score (Gemini embeddings + cosine similarity)
7. [ ] **Gemini Integration** (`convex/actions/gemini.ts`)
   - [ ] Screenshot analysis (disclosure detection)
   - [ ] Text embedding for alignment
8. [ ] **Orchestrator Action** (`convex/actions/runAudit.ts`)
   - [ ] Trigger Daytona sandbox
   - [ ] Process results from Daytona
   - [ ] Run scoring
   - [ ] Store findings
   - [ ] Update audit status
9. [ ] **Email Generation**
   - [ ] Generate remediation email text based on violations

**Dependency**: Needs Daytona API format from Person 3

---

### Person 3: Browser Automation (Daytona + Browser Use)
**Focus**: TikTok scraping, audio extraction, transcription

#### Tasks:
1. [ ] Set up Daytona account and workspace template
2. [ ] **Browser Use Script** (`daytona/tiktok-scraper.py`)
   - [ ] Navigate to TikTok profile
   - [ ] Extract latest 3-5 posts
   - [ ] For each post:
     - [ ] Click to open post
     - [ ] Expand caption (click "more")
     - [ ] Screenshot post view
     - [ ] Screenshot expanded caption
     - [ ] Play video for 15 seconds
     - [ ] Record tab audio
   - [ ] Return structured JSON
3. [ ] **Audio Processing**
   - [ ] Extract audio with ffmpeg
   - [ ] Send to transcription (Gemini or Whisper)
4. [ ] **API Endpoint**
   - [ ] Define input/output format for Convex to call
   - [ ] Handle errors gracefully (caption-only fallback)
5. [ ] Test with real TikTok profiles
6. [ ] Document the API contract for Person 2

**Output format** (for Person 2):
```json
{
  "creatorHandle": "@username",
  "posts": [
    {
      "postUrl": "https://tiktok.com/...",
      "captionText": "...",
      "transcriptText": "..." | null,
      "screenshots": ["base64...", "base64..."],
      "isBrandRelated": true | false,
      "audioSnippetUrl": "..." | null
    }
  ]
}
```

---

## Scraper Architecture (Optimized)

### Single-Pass Parallel Workers

```
┌─────────────────────────────────────────────────────────────────┐
│            3 PARALLEL WORKERS (Single Browser Session)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Worker 0 (Post #1)    Worker 1 (Post #2)    Worker 2 (Post #3) │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐ │
│  │ 1. Open post   │    │ 1. Open post   │    │ 1. Open post   │ │
│  │ 2. Get caption │    │ 2. Get caption │    │ 2. Get caption │ │
│  │ 3. Brand check │    │ 3. Brand check │    │ 3. Brand check │ │
│  │    ↓ YES       │    │    ↓ NO        │    │    ↓ YES       │ │
│  │ 4. Screenshot  │    │ 4. Return      │    │ 4. Screenshot  │ │
│  │ 5. Record 10s  │    │                │    │ 5. Record 10s  │ │
│  │ 6. Transcribe  │    │                │    │ 6. Transcribe  │ │
│  │ 7. Return all  │    │                │    │ 7. Return all  │ │
│  └────────────────┘    └────────────────┘    └────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Feature | Benefit |
|---------|---------|
| **Parallel workers** | 3x faster than sequential |
| **Single browser session** | No re-opening for full analysis |
| **Selective screenshots** | Only for brand-related posts |
| **Selective audio** | Only record/transcribe when needed |
| **Video recording** | Built into browser, extract audio with ffmpeg |

### Flow per Worker

1. Open browser with video recording enabled
2. Navigate to profile → click on assigned post
3. Extract caption text (use_vision=False for speed)
4. **Brand check**: Does caption contain brand keywords?
5. **If YES**: Take 2 screenshots, wait 10s for audio
6. **If NO**: Skip screenshots/audio, return immediately
7. Close browser (saves video file)
8. If brand-related: Extract audio with ffmpeg → transcribe with Gemini

### Usage

```bash
# Basic usage
python tiktok-scraper.py @charlidamelio --brand Nike --keywords nike "just do it"

# Environment variables needed
export BROWSER_USE_API_KEY="..."
export GOOGLE_API_KEY="..."  # For transcription
```

---

## Integration Points

| From | To | What |
|------|-----|------|
| Frontend | Convex | `createCampaign`, `runAudit` mutations |
| Frontend | Convex | `getAudit`, `getFindingsByAudit` queries (real-time) |
| Convex | Daytona | HTTP call to trigger scraping |
| Daytona | Convex | Return scraped data (JSON) |
| Convex | Gemini | Screenshot analysis, embeddings |

---

## Environment Variables

### `.env.local` (Frontend - gitignored)
```
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
```

### `.env` (Shared)
```
GOOGLE_API_KEY=<gemini-api-key>
BROWSER_USE_API_KEY=<browser-use-api-key>
```

### Convex Dashboard (set in Convex dashboard)
```
GOOGLE_API_KEY=<gemini-api-key>
BROWSER_USE_API_KEY=<browser-use-api-key>
```

---

## Getting Started

### Person 1 (Frontend)
```bash
cd brandr
npm install
npx shadcn@latest init
npm run dev
```

### Person 2 (Backend)
```bash
cd brandr
npx convex dev
# This will prompt to create a new project
```

### Person 3 (Daytona)
```bash
cd brandr/daytona
pip install -r requirements.txt
# Set up Daytona workspace via dashboard
```

---

## Merge Strategy
1. Person 1 builds UI with mock data
2. Person 2 builds Convex backend with test data
3. Person 3 builds Daytona script, tests independently
4. **Merge 1**: Connect Frontend ↔ Convex (swap mock data for real queries)
5. **Merge 2**: Connect Convex ↔ Daytona (wire up the runAudit action)
6. End-to-end test

---

## Commands

```bash
# Development
npm run dev          # Next.js dev server
npx convex dev       # Convex dev (watches for changes)

# Deployment
npx convex deploy    # Deploy Convex to production
vercel               # Deploy frontend to Vercel
```
