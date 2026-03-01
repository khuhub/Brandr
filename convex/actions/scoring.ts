"use node";

// Scoring logic for audit findings
// TODO (Person 2): Implement scoring algorithms

interface ScoringInput {
  captionText: string;
  transcriptText?: string;
  brandDescription: string;
  requiredDisclosureTokens: string[];
  competitorKeywords: string[];
  prohibitedClaimKeywords: string[];
}

interface ScoringResult {
  alignmentScore: number;
  riskScore: number;
  flags: {
    disclosureMissing: boolean;
    competitorMention: string[];
    prohibitedClaims: string[];
  };
}

// Calculate risk score based on rule violations
export function calculateRiskScore(input: ScoringInput): ScoringResult {
  const combinedText = `${input.captionText} ${input.transcriptText || ""}`.toLowerCase();

  let riskScore = 0;
  const flags = {
    disclosureMissing: true,
    competitorMention: [] as string[],
    prohibitedClaims: [] as string[],
  };

  // Check for disclosure tokens
  for (const token of input.requiredDisclosureTokens) {
    if (combinedText.includes(token.toLowerCase())) {
      flags.disclosureMissing = false;
      break;
    }
  }
  if (flags.disclosureMissing) {
    riskScore += 40;
  }

  // Check for competitor mentions
  for (const keyword of input.competitorKeywords) {
    if (combinedText.includes(keyword.toLowerCase())) {
      flags.competitorMention.push(keyword);
    }
  }
  if (flags.competitorMention.length > 0) {
    riskScore += 30;
  }

  // Check for prohibited claims
  for (const keyword of input.prohibitedClaimKeywords) {
    if (combinedText.includes(keyword.toLowerCase())) {
      flags.prohibitedClaims.push(keyword);
    }
  }
  if (flags.prohibitedClaims.length > 0) {
    riskScore += 30;
  }

  // Cap at 100
  riskScore = Math.min(riskScore, 100);

  // TODO: Implement alignment score using Gemini embeddings
  // For now, return a placeholder
  const alignmentScore = 50;

  return {
    alignmentScore,
    riskScore,
    flags,
  };
}

// Generate recommended action based on risk score
export function generateRecommendedAction(riskScore: number, flags: ScoringResult["flags"]): string {
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

// Generate remediation email draft
export function generateRemediationEmail(
  creatorHandle: string,
  postUrl: string,
  brandName: string,
  flags: ScoringResult["flags"]
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
