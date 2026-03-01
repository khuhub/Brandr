import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new audit
export const create = mutation({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const auditId = await ctx.db.insert("audits", {
      campaignId: args.campaignId,
      status: "queued",
      startedAt: Date.now(),
    });
    return auditId;
  },
});

// Update audit status
export const updateStatus = mutation({
  args: {
    auditId: v.id("audits"),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("done"),
      v.literal("failed")
    ),
    summary: v.optional(
      v.object({
        totalCreators: v.number(),
        flaggedCreators: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { status: args.status };

    if (args.status === "done" || args.status === "failed") {
      updates.endedAt = Date.now();
    }

    if (args.summary) {
      updates.summary = args.summary;
    }

    await ctx.db.patch(args.auditId, updates);
  },
});

// Get a single audit
export const get = query({
  args: { id: v.id("audits") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get audit by campaign
export const getByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("audits")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .order("desc")
      .first();
  },
});
