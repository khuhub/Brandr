import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new campaign
export const create = mutation({
  args: {
    brandName: v.string(),
    brandDescription: v.string(),
    requiredDisclosureTokens: v.array(v.string()),
    competitorKeywords: v.array(v.string()),
    prohibitedClaimKeywords: v.array(v.string()),
    creatorHandles: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const campaignId = await ctx.db.insert("campaigns", {
      ...args,
      createdAt: Date.now(),
    });
    return campaignId;
  },
});

// Get a single campaign
export const get = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List all campaigns
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("campaigns").order("desc").collect();
  },
});
