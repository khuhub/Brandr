import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const creatorSchema = {
  username: v.string(),
  followerCount: v.optional(v.string()),
  matchPercent: v.number(),
  matchLabel: v.string(),
};

export const replaceForCampaign = mutation({
  args: { campaignId: v.id("campaigns"), creators: v.array(v.object(creatorSchema)) },
  handler: async (ctx, { campaignId, creators }) => {
    const existing = await ctx.db.query("suggestedCreators").withIndex("by_campaign", (q) => q.eq("campaignId", campaignId)).collect();
    for (const row of existing) await ctx.db.delete(row._id);
    for (const c of creators) await ctx.db.insert("suggestedCreators", { campaignId, ...c });
  },
});

export const listByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, { campaignId }) =>
    await ctx.db.query("suggestedCreators").withIndex("by_campaign", (q) => q.eq("campaignId", campaignId)).collect(),
});
