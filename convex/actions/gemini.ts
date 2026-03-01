"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

// Gemini API integration for VLM and embeddings
// TODO (Person 2): Complete Gemini integration

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

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

    try {
      // Extract JSON from response
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback if parsing fails
    }

    return { hasDisclosure: false, disclosureType: null, confidence: 0 };
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

// Calculate cosine similarity between two embeddings
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}
