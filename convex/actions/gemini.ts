"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

// Gemini API integration for VLM and embeddings
// TODO (Person 2): Complete Gemini integration

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

function parseJsonFromResponse<T>(text: string | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as T;
  } catch {
    // ignore
  }
  return fallback;
}

// Analyze screenshot for disclosure detection
export const analyzeScreenshot = action({
  args: {
    imageBase64: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY not configured");
    }

    const response = await fetch(
      `${GEMINI_API_URL}/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this TikTok screenshot for sponsorship disclosure indicators.
Look for:
- "Paid partnership" labels
- "#ad" or "#sponsored" hashtags
- "Sponsored" text overlays
- Any FTC disclosure indicators

Respond with JSON: { "hasDisclosure": boolean, "disclosureType": string | null, "confidence": number }`,
                },
                {
                  inline_data: {
                    mime_type: "image/png",
                    data: args.imageBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = parseJsonFromResponse<{ hasDisclosure?: boolean; disclosureType?: string | null; confidence?: number }>(text, {});
    return {
      hasDisclosure: parsed.hasDisclosure ?? false,
      disclosureType: parsed.disclosureType ?? null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    };
  },
});

// Get text embedding for alignment scoring
export const getEmbedding = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY not configured");
    }

    const response = await fetch(
      `${GEMINI_API_URL}/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: {
            parts: [{ text: args.text }],
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding?.values || [];
  },
});

/** Gemini scores how well post content aligns with the brand (0–100). */
export const scoreAlignment = action({
  args: {
    brandDescription: v.string(),
    captionText: v.string(),
    transcriptText: v.optional(v.string()),
    visualSummary: v.optional(v.string()),
    aiReasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");

    const content = [args.captionText, args.transcriptText].filter(Boolean).join("\n").trim() || "(no caption or transcript)";
    const extra = [args.visualSummary && `Visual: ${args.visualSummary}`, args.aiReasoning && `Prior analysis: ${args.aiReasoning}`].filter(Boolean).join("\n\n");
    const response = await fetch(
      `${GEMINI_API_URL}/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are evaluating influencer post content for brand alignment.

Brand description:
${args.brandDescription}

Post caption and/or transcript:
${content}
${extra ? `\nAdditional context:\n${extra}` : ""}

Score how well this post aligns with the brand (tone, values, messaging, relevance) from 0 to 100.
Consider nuance: partial alignment, off-brand humor, or mixed signals should score in the middle range.
Respond with only this JSON: { "alignmentScore": number }`,
            }],
          }],
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = parseJsonFromResponse<{ alignmentScore?: number }>(text, {});
    const score = typeof parsed.alignmentScore === "number"
      ? Math.max(0, Math.min(100, Math.round(parsed.alignmentScore)))
      : 50;
    return { alignmentScore: score };
  },
});

/** Gemini scores risk and flags (nuanced, not just keyword matching). */
export const scoreRisk = action({
  args: {
    captionText: v.string(),
    transcriptText: v.optional(v.string()),
    requiredDisclosureTokens: v.array(v.string()),
    competitorKeywords: v.array(v.string()),
    prohibitedClaimKeywords: v.array(v.string()),
    screenshotBase64: v.optional(v.string()),
    visualSummary: v.optional(v.string()),
    aiReasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");

    const content = [args.captionText, args.transcriptText].filter(Boolean).join("\n").trim() || "(no text)";
    const extraContext = [
      args.visualSummary ? `Visual description of the video:\n${args.visualSummary}` : "",
      args.aiReasoning ? `Prior analysis/reasoning about this post:\n${args.aiReasoning}` : "",
    ].filter(Boolean).join("\n\n");

    const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
      {
        text: `You are evaluating influencer post content for compliance risk.

Required disclosure tokens (e.g. #ad, #sponsored): ${JSON.stringify(args.requiredDisclosureTokens)}
Competitor keywords to watch: ${JSON.stringify(args.competitorKeywords)}
Prohibited claim keywords: ${JSON.stringify(args.prohibitedClaimKeywords)}

Post caption and/or transcript:
${content}
${extraContext ? `\nAdditional context:\n${extraContext}` : ""}

${args.screenshotBase64 ? "A screenshot of the post is also provided; consider on-screen disclosure (e.g. paid partnership, #ad) in the image." : ""}

Score overall compliance risk from 0 (no issues) to 100 (serious violations). Consider severity and context, not just keyword presence (e.g. clear competitor promo vs casual mention).
Respond with only this JSON:
{
  "riskScore": number,
  "disclosureMissing": boolean,
  "competitorMention": string[],
  "prohibitedClaims": string[]
}
Use empty arrays when none found. competitorMention and prohibitedClaims: list the specific phrases or terms you identified.`,
      },
    ];
    if (args.screenshotBase64) {
      parts.push({ inline_data: { mime_type: "image/png", data: args.screenshotBase64 } });
    }

    const response = await fetch(
      `${GEMINI_API_URL}/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = parseJsonFromResponse<{
      riskScore?: number;
      disclosureMissing?: boolean;
      competitorMention?: string[];
      prohibitedClaims?: string[];
    }>(text, {});

    const riskScore = typeof parsed.riskScore === "number"
      ? Math.max(0, Math.min(100, Math.round(parsed.riskScore)))
      : 50;
    return {
      riskScore,
      flags: {
        disclosureMissing: typeof parsed.disclosureMissing === "boolean" ? parsed.disclosureMissing : true,
        competitorMention: Array.isArray(parsed.competitorMention) ? parsed.competitorMention : [],
        prohibitedClaims: Array.isArray(parsed.prohibitedClaims) ? parsed.prohibitedClaims : [],
      },
    };
  },
});
