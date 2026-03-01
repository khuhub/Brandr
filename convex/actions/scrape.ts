"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/** Scrape TikTok creators for brand compliance. Creates campaign and runs audit. */
export const scrape = action({
  args: {
    creatorHandles: v.array(v.string()),
    brand: v.string(),
    keywords: v.array(v.string()),
    posts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const campaignId = await ctx.runMutation(api.campaigns.create, {
      brandName: args.brand,
      brandDescription: args.brand,
      requiredDisclosureTokens: args.keywords,
      competitorKeywords: [],
      prohibitedClaimKeywords: [],
      creatorHandles: args.creatorHandles,
      postsPerCreator: args.posts,
    });
    const result = await ctx.runAction(api.actions.runAudit.run, { campaignId });
    return { campaignId, ...result };
  },
});
