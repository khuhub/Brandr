"use node";

// Helpers for recommended action and remediation email (scores come from Gemini).

export interface ScoringFlags {
  disclosureMissing: boolean;
  competitorMention: string[];
  prohibitedClaims: string[];
}

export function generateRecommendedAction(riskScore: number, flags: ScoringFlags): string {
  if (riskScore >= 60) {
    const issues: string[] = [];
    if (flags.disclosureMissing) issues.push("missing disclosure");
    if (flags.competitorMention.length > 0) issues.push("competitor mention");
    if (flags.prohibitedClaims.length > 0) issues.push("prohibited claims");

    return `Immediate action required: ${issues.join(", ")}. Send remediation email.`;
  } else if (riskScore >= 30) {
    return "Review recommended. Minor compliance issues detected.";
  }
  return "No action needed. Content is compliant.";
}

export function generateRemediationEmail(
  creatorHandle: string,
  postUrl: string,
  brandName: string,
  flags: ScoringFlags
): string {
  const issues: string[] = [];

  if (flags.disclosureMissing) {
    issues.push("- Missing required sponsorship disclosure (e.g., #ad, #sponsored)");
  }
  if (flags.competitorMention.length > 0) {
    issues.push(`- Mention of competitor brand(s): ${flags.competitorMention.join(", ")}`);
  }
  if (flags.prohibitedClaims.length > 0) {
    issues.push(`- Use of prohibited claims: ${flags.prohibitedClaims.join(", ")}`);
  }

  return `Subject: Action Required - Content Compliance Issue for ${brandName}

Hi ${creatorHandle},

We've identified compliance issues with your recent post that requires immediate attention:

Post URL: ${postUrl}

Issues Found:
${issues.join("\n")}

Required Action:
Please update your post within 24 hours to address these issues. If the post cannot be modified, please remove it and create a compliant replacement.

For questions about our brand guidelines, please reply to this email.

Best regards,
${brandName} Brand Team`;
}
