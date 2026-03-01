import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  campaigns: defineTable({
    brandName: v.string(),
    brandDescription: v.string(),
    requiredDisclosureTokens: v.array(v.string()),
    competitorKeywords: v.array(v.string()),
    prohibitedClaimKeywords: v.array(v.string()),
    creatorHandles: v.array(v.string()),
    createdAt: v.number(),
  }),

  audits: defineTable({
    campaignId: v.id("campaigns"),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("done"),
      v.literal("failed")
    ),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    summary: v.optional(
      v.object({
        totalCreators: v.number(),
        flaggedCreators: v.number(),
      })
    ),
  }).index("by_campaign", ["campaignId"]),

  auditFindings: defineTable({
    auditId: v.id("audits"),
    creatorHandle: v.string(),
    postUrl: v.string(),
    captionText: v.string(),
    transcriptText: v.optional(v.string()),
    alignmentScore: v.number(),
    riskScore: v.number(),
    flags: v.object({
      disclosureMissing: v.boolean(),
      competitorMention: v.array(v.string()),
      prohibitedClaims: v.array(v.string()),
    }),
    evidence: v.object({
      screenshots: v.array(v.string()),
      audioSnippetUrl: v.optional(v.string()),
    }),
    recommendedAction: v.string(),
    // Enrichment from scraper / extraction
    visualSummary: v.optional(v.string()),
    viewCount: v.optional(v.string()),
    likeCount: v.optional(v.string()),
    brandMentioned: v.optional(v.boolean()),
    disclosureFound: v.optional(v.boolean()),
    complianceStatus: v.optional(v.string()),
    detectedKeywords: v.optional(v.array(v.string())),
    detectedDisclosures: v.optional(v.array(v.string())),
    potentialSponsoredContent: v.optional(v.boolean()),
    aiReasoning: v.optional(v.string()),
  }).index("by_audit", ["auditId"]),
});
