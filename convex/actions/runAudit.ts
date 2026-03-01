"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { api } from "../_generated/api";
import { calculateRiskScore, generateRecommendedAction, generateRemediationEmail } from "./scoring";

// Main orchestrator action that runs the audit
// TODO (Person 2 + Person 3): Complete Daytona integration

export const run = action({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; auditId: Id<"audits"> }> => {
    // 1. Get campaign details
    const campaign = await ctx.runQuery(api.campaigns.get, { id: args.campaignId });
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // 2. Create audit record
    const auditId: Id<"audits"> = await ctx.runMutation(api.audits.create, {
      campaignId: args.campaignId,
    });

    // 3. Update status to running
    await ctx.runMutation(api.audits.updateStatus, {
      auditId,
      status: "running",
    });

    try {
      // 4. Call Daytona to scrape TikTok profiles
      // TODO (Person 3): Replace with actual Daytona API call
      const scrapedData = await callDaytona(campaign.creatorHandles);

      let flaggedCreators = 0;

      // 5. Process each creator's posts
      for (const creator of scrapedData) {
        for (const post of creator.posts) {
          // Calculate scores
          const scoring = calculateRiskScore({
            captionText: post.captionText,
            transcriptText: post.transcriptText,
            brandDescription: campaign.brandDescription,
            requiredDisclosureTokens: campaign.requiredDisclosureTokens,
            competitorKeywords: campaign.competitorKeywords,
            prohibitedClaimKeywords: campaign.prohibitedClaimKeywords,
          });

          const recommendedAction = generateRecommendedAction(scoring.riskScore, scoring.flags);

          // Store finding
          await ctx.runMutation(api.findings.create, {
            auditId,
            creatorHandle: creator.creatorHandle,
            postUrl: post.postUrl,
            captionText: post.captionText,
            transcriptText: post.transcriptText,
            alignmentScore: scoring.alignmentScore,
            riskScore: scoring.riskScore,
            flags: scoring.flags,
            evidence: {
              screenshots: post.screenshots,
              audioSnippetUrl: post.audioSnippetUrl,
            },
            recommendedAction,
          });

          if (scoring.riskScore >= 60) {
            flaggedCreators++;
          }
        }
      }

      // 6. Update audit as complete
      await ctx.runMutation(api.audits.updateStatus, {
        auditId,
        status: "done",
        summary: {
          totalCreators: campaign.creatorHandles.length,
          flaggedCreators,
        },
      });

      return { success: true, auditId };
    } catch (error) {
      // Handle failure
      await ctx.runMutation(api.audits.updateStatus, {
        auditId,
        status: "failed",
      });
      throw error;
    }
  },
});

// Placeholder for Daytona API call
// TODO (Person 3): Implement actual Daytona integration
interface DaytonaPost {
  postUrl: string;
  captionText: string;
  transcriptText?: string;
  screenshots: string[];
  audioSnippetUrl?: string;
}

interface DaytonaCreatorResult {
  creatorHandle: string;
  posts: DaytonaPost[];
}

async function callDaytona(creatorHandles: string[]): Promise<DaytonaCreatorResult[]> {
  // TODO: Replace with actual Daytona API call
  // This is a placeholder that returns mock data for testing

  const DAYTONA_API_URL = process.env.DAYTONA_API_URL;
  const DAYTONA_API_KEY = process.env.DAYTONA_API_KEY;

  if (!DAYTONA_API_URL || !DAYTONA_API_KEY) {
    console.warn("Daytona not configured, returning mock data");
    return creatorHandles.map((handle) => ({
      creatorHandle: handle,
      posts: [
        {
          postUrl: `https://tiktok.com/@${handle}/video/123`,
          captionText: "Check out this amazing product! Link in bio",
          transcriptText: "Hey guys, I've been using this product for a week and it's incredible",
          screenshots: [],
          audioSnippetUrl: undefined,
        },
      ],
    }));
  }

  // Actual Daytona API call
  const response = await fetch(`${DAYTONA_API_URL}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${DAYTONA_API_KEY}`,
    },
    body: JSON.stringify({ creatorHandles }),
  });

  if (!response.ok) {
    throw new Error(`Daytona API error: ${response.statusText}`);
  }

  return response.json();
}
