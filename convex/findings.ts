import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new finding
export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditFindings", args);
  },
});

// Get findings by audit
export const getByAudit = query({
  args: { auditId: v.id("audits") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditFindings")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .collect();
  },
});

// Get a single finding
export const get = query({
  args: { id: v.id("auditFindings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
