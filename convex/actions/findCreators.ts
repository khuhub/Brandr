"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

const LABELS = ["Top Match", "Second Match", "Third Match"];

export const findCreators = action({
  args: { campaignId: v.id("campaigns"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { campaignId, limit: limitNum = 3 } = args;
    const audit = await ctx.runQuery(api.audits.getByCampaign, { campaignId });
    if (!audit) return [];
    const findings = await ctx.runQuery(api.findings.getByAudit, { auditId: audit._id });
    if (!findings.length) return [];

    const byCreator = new Map<string, { sum: number; count: number }>();
    for (const f of findings) {
      const cur = byCreator.get(f.creatorHandle) ?? { sum: 0, count: 0 };
      cur.sum += f.riskScore;
      cur.count += 1;
      byCreator.set(f.creatorHandle, cur);
    }
    const top = Array.from(byCreator.entries())
      .map(([username, { sum, count }]) => ({ username, avgRisk: sum / count }))
      .sort((a, b) => a.avgRisk - b.avgRisk)
      .slice(0, limitNum)
      .map((c, i) => ({
        username: c.username,
        followerCount: "" as string | undefined,
        matchPercent: Math.round(100 - c.avgRisk),
        matchLabel: LABELS[i] ?? "Match",
      }));

    await ctx.runMutation(api.suggestedCreators.replaceForCampaign, { campaignId, creators: top });
    return top.map(({ followerCount, ...r }) => ({ ...r, followerCount: followerCount ?? "" }));
  },
});
