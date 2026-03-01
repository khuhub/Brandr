# BrandGuard PRD (Hackathon MVP - 12 Hours)

## Product Name
BrandGuard

## One-Sentence Pitch
Brands spend billions on influencer marketing but have zero real-time governance over what creators actually publish. BrandGuard audits creator posts using browser agents, audio transcription, and multimodal analysis, and automatically triggers remediation when risk is detected.

---

# 1. Problem

Influencer marketing scaled. Governance did not.

Brands working with dozens or hundreds of creators have:
- No automated monitoring
- No real-time risk alerts
- No scalable way to evaluate brand alignment
- No proactive enforcement system

Current solutions:
- Manual checking
- Google Sheets
- DM threads
- Influencer CRMs (contract/payment only)

There is no AI governance layer monitoring what creators actually publish.

---

# 2. Target Customer

Primary:
- Influencer marketing managers at brands

Secondary:
- Agencies managing multiple creators

---

# 3. Core MVP Scope (12 Hour Build)

Single platform: TikTok
Single audit mode: On-demand (manual trigger)
Audit depth: Latest 3–5 posts per creator

No continuous monitoring.
No prediction.
No multi-platform.
No ROI forecasting.

---

# 4. High-Level Flow

1. User creates Campaign
2. Inputs:
   - brandName
   - brandDescription
   - requiredDisclosureTokens
   - competitorKeywords
   - prohibitedClaimKeywords
   - creatorHandles

3. User clicks "Run Audit"

4. System:
   - Spins up Daytona sandbox
   - Uses Browser Use to navigate TikTok
   - Extracts latest 3–5 posts per creator
   - For each post:
       - Expand caption
       - Screenshot post view
       - Screenshot expanded caption
       - Play video for 10–20 seconds
       - Record tab/system audio
       - Extract audio to .wav via ffmpeg
       - Transcribe audio
   - Run compliance + alignment scoring
   - Store evidence
   - Generate remediation email (optionally send)
   - Return structured results

---

# 5. Technical Architecture

UI → Convex → Orchestrator → Daytona Sandbox
Daytona → Browser Use → TikTok UI
Daytona → Audio Recorder → ffmpeg
Daytona → Transcription Model
Orchestrator → Gemini VLM (screenshots)
Orchestrator → Rule Engine
Orchestrator → Agentmail (optional)
Orchestrator → Convex DB

---

# 6. Data Model (Convex)

## campaigns
- _id
- brandName
- brandDescription
- requiredDisclosureTokens: string[]
- competitorKeywords: string[]
- prohibitedClaimKeywords: string[]
- creatorHandles: string[]
- createdAt

## audits
- _id
- campaignId
- status: "queued" | "running" | "done" | "failed"
- startedAt
- endedAt
- summary: {
    totalCreators: number,
    flaggedCreators: number
  }

## auditFindings
- _id
- auditId
- creatorHandle
- postUrl
- captionText
- transcriptText
- alignmentScore: number
- riskScore: number
- flags: {
    disclosureMissing: boolean,
    competitorMention: string[],
    prohibitedClaims: string[]
  }
- evidence: {
    screenshots: string[],
    audioSnippetUrl?: string
  }
- recommendedAction: string

---

# 7. Audit Logic

## Step 1: Extract Posts

For each creator:
- Navigate to profile
- Extract latest 3–5 posts
- For each post:
    - Expand caption
    - Capture 2 screenshots
    - Play video for 10–20 seconds
    - Record audio stream
    - Extract .wav via ffmpeg
    - Transcribe audio

If audio fails:
- Continue with caption-only mode

---

## Step 2: Detect Brand-Related Posts

A post is considered brand-related if:
- Caption OR transcript contains:
    - brandName
    - campaign hashtag
    - product name
    - discount code
    - @brand handle

If none found:
- Skip post
- Mark as "Non-brand post"

---

## Step 3: Scoring

### Alignment Score
- Embed brandDescription
- Embed (caption + transcript)
- Cosine similarity
- Normalize 0–100

### Risk Score
Start at 0.

If disclosure token not found in caption OR transcript:
    +40

If competitor keyword found:
    +30

If prohibited claim found:
    +30

Cap at 100.

---

# 8. Disclosure Detection

Check:
- Caption contains requiredDisclosureTokens
- Transcript contains requiredDisclosureTokens
- Gemini VLM on screenshot detects:
    - "Paid partnership"
    - "#ad"
    - "Sponsored"

If none:
    disclosureMissing = true

---

# 9. Automated Action

If riskScore >= 60:
- Generate remediation email body
- Include:
    - What failed
    - Post URL
    - Screenshots
    - Suggested fix

User can:
- Click "Send Email" (Agentmail)
OR
- Copy email manually

---

# 10. UI Requirements

## Page 1: Campaign Setup
Form fields:
- brandName
- brandDescription
- requiredDisclosureTokens
- competitorKeywords
- prohibitedClaimKeywords
- creatorHandles (comma-separated)

Button: Run Audit

---

## Page 2: Dashboard

Table columns:
- Creator
- Alignment Score
- Risk Score
- Flags
- Action Status

Sortable by:
- Risk
- Alignment

---

## Page 3: Creator Detail

Show:
- Caption
- Transcript excerpt
- Screenshots
- Risk breakdown
- Email draft

---

# 11. Daytona Requirements

Each audit runs inside isolated Daytona workspace.

Workspace responsibilities:
- Launch browser session
- Record video tab audio
- Save audio to temp file
- Run ffmpeg extraction
- Send audio to transcription
- Return structured JSON

Destroy workspace after audit.

---

# 12. Fallback Logic

If:
- Audio extraction fails
OR
- Transcription fails

Then:
- Score based on caption only
- Mark transcriptText = "Unavailable"

Never fail entire audit because of audio.

---

# 13. Demo Plan (3 Minutes)

1. Enter campaign rules.
2. Click Run Audit.
3. Show live status.
4. Open flagged creator.
5. Show transcript excerpt + screenshot.
6. Show risk breakdown.
7. Generate remediation email.

---

# 14. Out of Scope

- Multi-platform
- Predictive risk modeling
- Continuous monitoring
- ROI estimation
- Historical trend analysis

---

# 15. Success Criteria

- Audit completes for at least 2 creators.
- At least 1 flagged violation.
- Transcript visible in UI.
- Screenshot evidence displayed.
- Email draft generated.

---

# END OF PRD