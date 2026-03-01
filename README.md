# Brandr
## Inspiration
Brands pour billions into influencer marketing, but the moment content goes live, control slips away. Did the creator add the right disclosure? Mention a competitor? Make a claim the brand never approved? Today, compliance is manual: someone has to watch every post, read every caption, and catch every slip — and by then, it’s already in front of millions.
We built Brandr from the belief that brand safety in the creator economy should be automated, real-time, and intelligent. Large language models and vision models can now read captions, analyze screenshots, and reason about context — so why are teams still scrolling feeds by hand? The loop is simple: **observe creator content, interpret it against brand and compliance rules, and act** (flag, remediate, or approve). Today most tools stop at step one. Brandr completes the loop.
Brandr is the orchestration layer between TikTok (and eventually other platforms), AI-powered analysis, and your brand rules. It turns scattered creator posts into structured audits: alignment scores, risk flags, disclosure checks, and ready-to-send remediation guidance. No more passive monitoring — real-time intelligence for influencer compliance.
---
## What it does
Brandr is a brand compliance auditing platform for influencer campaigns. You define a campaign once: brand name, description, required disclosure tokens (e.g. `#ad`, `#sponsored`), competitor keywords, and prohibited claim keywords. Add creator handles, run an audit, and Brandr scrapes their TikTok content, analyzes captions and transcripts, inspects screenshots for disclosure, and scores each post for **alignment** (how well it fits the brand) and **risk** (missing disclosures, competitor mentions, prohibited claims).
The result is a dashboard of findings: per-creator, per-post alignment and risk scores, flags for disclosure issues and competitor or prohibited language, and evidence (screenshots, transcripts). For high-risk findings, you get a recommended action and a remediation email draft — so your team can act quickly instead of hunting through feeds.
One workflow, many use cases: launch audits after campaign briefs, monitor ongoing partnerships, or vet new creators before signing. Brandr adapts to your brand rules and scales with your creator list, turning influencer compliance from a manual chore into a repeatable, AI-powered process.
---
## How we built it
We built Brandr with a clear pipeline: **campaign setup → scraping → AI analysis → scoring → findings and remediation**. The frontend drives configuration and visualization; Convex handles data, real-time updates, and orchestration; and a hybrid scraping stack (Browser Use) plus Gemini powers the observation and reasoning layers.
### AI & ML
We use **Google Gemini** end-to-end for understanding and scoring:
- **Gemini 2.5 Flash** for **screenshot analysis**: each TikTok post screenshot is analyzed for sponsorship disclosure (e.g. “Paid partnership”, `#ad`, “Sponsored” overlays), returning structured JSON (`hasDisclosure`, `disclosureType`, `confidence`).
- **Gemini 2.5 Flash** for **alignment scoring**: caption + transcript (and optional visual summary / prior reasoning) are evaluated against the brand description; the model returns an alignment score (0–100) based on tone, values, and messaging fit.
- ** Text Embedding 004** is available for future embedding-based alignment (e.g. cosine similarity to brand guidelines).
Scoring logic lives in Convex actions (`gemini.ts`, `scoring.ts`): we call Gemini from the backend, parse JSON from the model output, and derive a human-readable **recommended action** (e.g. “Immediate action required: missing disclosure. Send remediation email.”) from risk and flags. This keeps compliance logic in one place and makes it easy to tune thresholds and add new rules.
### Scraping & browser automation
Creator content is the input to the whole system. We support two paths:
- ** Browser Use (Python)** in `agent/tiktok-scraper.py`: an AI-driven browser agent that navigates TikTok profiles, opens posts, expands captions, captures screenshots, and (when needed) records and transcribes audio. The script is **compliance-first**: it detects brand mentions and disclosure tokens, and outputs a structured JSON per creator with `captionText`, `transcriptText`, `screenshots`, `brandMentioned`, `disclosureFound`, `complianceStatus`, and optional visual/LLM summaries for downstream Gemini steps.
The scraper design favors **parallel workers** and **selective deep analysis** (screenshots and transcription mainly for brand-related posts) to keep cost and latency under control while still giving the AI enough signal to score alignment and risk accurately.
### Data & logic
- **Convex** is the single source of truth: **campaigns**, **audits**, and **auditFindings** (and **suggestedCreators** for follow-up recommendations). Campaigns store brand config and creator handles; audits track status (queued → running → done/failed) and optional summary (e.g. total vs flagged creators); findings store per-post scores, flags, evidence, and recommended actions.
- The **runAudit** action orchestrates the pipeline: create audit, then for each creator/post call Gemini for alignment and risk, compute recommended action, and persist findings. Real-time subscriptions in the frontend mean the dashboard and creator detail views update as soon as new findings land.
- Remediation logic is centralized in `scoring.ts` (e.g. “Immediate action required” when risk ≥ 60); email draft generation is specified in the implementation plan and can be added as a Convex action or frontend step that consumes findings and flags.
### Frontend
The app is **Next.js 14** (App Router) with **TypeScript**, **Tailwind CSS**, and **shadcn/ui** (Radix primitives). Three main pages:
1. **Campaign setup** — form for brand name, description, disclosure tokens, competitor and prohibited keywords, creator handles; submit creates the campaign and triggers the audit.
2. **Audit dashboard** — audit status (running/done/failed), creator-level table with alignment, risk, flags, and drill-down to per-post detail.
3. **Creator detail** — caption, transcript, screenshot gallery, risk breakdown, and remediation email draft with copy-to-clipboard.
Convex React hooks (`useQuery`, `useMutation`) bind the UI to live data, so the dashboard and creator views stay in sync with backend state without polling. The stack is chosen for speed of iteration and for a clear path to deployment on Vercel (frontend) and Convex Cloud (backend).
---
## Challenges we ran into
- **Scraping at scale**: TikTok is dynamic and often anti-scraping; balancing Browser Use’s flexibility with cost and reliability required a compliance-first design (e.g. brand/disclosure checks before expensive screenshot + transcription) and a fallback to caption-only when audio or screenshots fail.
- **Keeping AI scoring grounded**: We wanted risk and alignment to reflect context (e.g. “competitor mentioned in a negative way” vs “casual mention”), not just keyword presence. Tuning prompts and JSON output for Gemini so that scores and flags are both nuanced and parseable took several iterations.
- **Orchestration and fallbacks**: Wiring Convex → scraper and handling partial failures (e.g. one creator times out) while still updating audit status and persisting partial results required clear state transitions (queued → running → done/failed) and defensive handling in the runAudit action.
- **Unifying the pipeline**: Aligning the scraper’s output schema with Convex’s `auditFindings` and Gemini’s expected inputs (caption, transcript, optional screenshot, optional visual summary) so that the same pipeline works with mock data and live scraping was a deliberate design focus.
---
## Accomplishments that we're proud of
We’re proud of turning a manual, feed-scrolling workflow into a single **campaign → audit → findings → remediation** pipeline. Brandr demonstrates end-to-end automation: define brand rules and creator list, run one audit, and get back structured alignment and risk scores, disclosure checks, and actionable recommendations.
We integrated **multimodal AI** (text + image) for disclosure and risk in a way that stays interpretable (structured flags and scores) and we kept the architecture modular so that scraping can be swapped (Browser Use, Daytona, or future providers) without rewriting the scoring or frontend. The result is a working prototype that can scale from a handful of creators to larger campaigns as the scraping and Convex layers are hardened — and a clear path to remediation emails and suggested “next best” creators (e.g. via `findCreators` and `suggestedCreators`) so the product doesn’t just flag issues but helps fix them and grow the roster.
---
## What we learned
We learned that **influencer compliance is a perfect fit for LLM + VLM reasoning**: the rules are complex and context-dependent, and a model that can read captions, transcripts, and screenshots beats rigid keyword rules. We also saw how important it is to **structure model outputs** (JSON with clear fields) so that downstream logic and UI can rely on them without brittle parsing.
We gained respect for the **scraping and automation layer** as the hardest part of the pipeline — not the AI itself. Getting reliable, structured data from TikTok (or any social platform) and normalizing it for Convex and Gemini was the main integration challenge. Finally, we saw how **real-time updates** (Convex subscriptions) and a simple three-page flow (setup → dashboard → detail) make the product feel immediate and actionable instead of “run report and wait.”
---
9:38
## What's next for Brandr
### Short-term
- Finish **remediation email generation** (Convex action or template that consumes findings and produces copy-paste or send-ready drafts).
- Harden **Browser Use integration** (retries, timeouts, partial-result handling) and add more robust caption-only fallback when audio/screenshots fail.
- Enrich **creator detail** and **dashboard** UI: sortable columns, risk badges, screenshot gallery, and one-click copy for email drafts.
### AI/ML features
- **Richer visual analysis**: use Gemini to describe the video frame (e.g. product placement, text overlays) and feed that into alignment and risk.
- **Embedding-based alignment**: compare creator post embeddings to brand guideline embeddings for a consistent “brand fit” signal alongside LLM scoring.
- **Proactive suggestions**: use audit history and performance to recommend creators who stay compliant and align well (“suggested creators” already scaffolded in schema and `findCreators`).
### Platform upgrades
- **More platforms**: Instagram Reels, YouTube Shorts — same pipeline (scrape → analyze → score → findings), with platform-specific scrapers and disclosure norms.
- **Scheduled and recurring audits**: run audits on a schedule or when new posts are detected, so compliance is continuous, not one-off.
- **API and webhooks**: let external tools create campaigns, trigger audits, and consume findings (e.g. for CRM or legal workflows).
### Community and ops
- **Open scraper contracts**: document input/output formats so others can plug in their own scrapers or run the Python script in their own environment.
- **Configurable thresholds**: let brands set their own risk thresholds and disclosure requirements via the campaign form and store them in the campaign document.
- **Export and reporting**: CSV/PDF export of findings and simple summary reports for legal or marketing teams.
