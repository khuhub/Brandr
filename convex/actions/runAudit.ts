"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { generateRecommendedAction } from "./scoring";

// Main orchestrator action that runs the audit
// TODO (Person 2 + Person 3): Complete Daytona integration

export const run = action({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    // 1. Get campaign details
    const campaign = await ctx.runQuery(api.campaigns.get, { id: args.campaignId });
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const auditId = await ctx.runMutation(api.audits.create, {
      campaignId: args.campaignId,
    });

    await ctx.runMutation(api.audits.updateStatus, {
      auditId,
      status: "running",
    });

    try {
      const scrapedData = await callDaytona(campaign.creatorHandles);
      let flaggedCreators = 0;

      for (const creator of scrapedData) {
        for (const post of creator.posts) {
          const { alignmentScore } = await ctx.runAction(api.actions.gemini.scoreAlignment, {
            brandDescription: campaign.brandDescription,
            captionText: post.captionText,
            transcriptText: post.transcriptText,
            visualSummary: post.visualSummary,
            aiReasoning: post.aiReasoning,
          });

          const { riskScore, flags } = await ctx.runAction(api.actions.gemini.scoreRisk, {
            captionText: post.captionText,
            transcriptText: post.transcriptText,
            requiredDisclosureTokens: campaign.requiredDisclosureTokens,
            competitorKeywords: campaign.competitorKeywords,
            prohibitedClaimKeywords: campaign.prohibitedClaimKeywords,
            screenshotBase64: post.screenshots?.[0],
            visualSummary: post.visualSummary,
            aiReasoning: post.aiReasoning,
          });

          const recommendedAction = generateRecommendedAction(riskScore, flags);

          await ctx.runMutation(api.findings.create, {
            auditId,
            creatorHandle: creator.creatorHandle,
            postUrl: post.postUrl,
            captionText: post.captionText,
            transcriptText: post.transcriptText,
            alignmentScore,
            riskScore,
            flags,
            evidence: {
              screenshots: post.screenshots ?? [],
              audioSnippetUrl: post.audioSnippetUrl,
            },
            recommendedAction,
            visualSummary: post.visualSummary,
            viewCount: post.viewCount,
            likeCount: post.likeCount,
            brandMentioned: post.brandMentioned,
            disclosureFound: post.disclosureFound,
            complianceStatus: post.complianceStatus,
            detectedKeywords: post.detectedKeywords,
            detectedDisclosures: post.detectedDisclosures,
            potentialSponsoredContent: post.potentialSponsoredContent,
            aiReasoning: post.aiReasoning,
          });

          if (riskScore >= 60) {
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

// Matches scraper extraction output (Daytona / Browser Use)
interface DaytonaPost {
  postUrl: string;
  captionText: string;
  transcriptText?: string;
  screenshots?: string[];
  audioSnippetUrl?: string;
  visualSummary?: string;
  viewCount?: string;
  likeCount?: string;
  brandMentioned?: boolean;
  disclosureFound?: boolean;
  complianceStatus?: string;
  detectedKeywords?: string[];
  detectedDisclosures?: string[];
  potentialSponsoredContent?: boolean;
  aiReasoning?: string;
}

interface DaytonaCreatorResult {
  creatorHandle: string;
  posts: DaytonaPost[];
  summary?: {
    totalPosts: number;
    violations: number;
    compliant: number;
    notBrandRelated: number;
  };
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
          visualSummary: undefined,
          viewCount: undefined,
          likeCount: undefined,
          brandMentioned: undefined,
          disclosureFound: undefined,
          complianceStatus: undefined,
          detectedKeywords: undefined,
          detectedDisclosures: undefined,
          potentialSponsoredContent: undefined,
          aiReasoning: undefined,
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

export const runAudit = run;
