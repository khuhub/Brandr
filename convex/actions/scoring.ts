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
