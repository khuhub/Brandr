"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { generateRemediationEmail } from "./scoring";

/** Generate remediation email body for a finding (for UI email draft). */
export const getRemediationEmail = action({
  args: { findingId: v.id("auditFindings") },
  handler: async (ctx, args) => {
    const finding = await ctx.runQuery(api.findings.get, { id: args.findingId });
    if (!finding) return null;
    const audit = await ctx.runQuery(api.audits.get, { id: finding.auditId });
    if (!audit) return null;
    const campaign = await ctx.runQuery(api.campaigns.get, { id: audit.campaignId });
    if (!campaign) return null;
    return generateRemediationEmail(
      finding.creatorHandle,
      finding.postUrl,
      campaign.brandName,
      finding.flags
    );
  },
});
