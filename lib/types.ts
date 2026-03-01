// Shared types for the application

export interface Campaign {
  _id: string;
  brandName: string;
  brandDescription: string;
  requiredDisclosureTokens: string[];
  competitorKeywords: string[];
  prohibitedClaimKeywords: string[];
  creatorHandles: string[];
  createdAt: number;
}

export interface Audit {
  _id: string;
  campaignId: string;
  status: "queued" | "running" | "done" | "failed";
  startedAt?: number;
  endedAt?: number;
  summary?: {
    totalCreators: number;
    flaggedCreators: number;
  };
}

export interface AuditFinding {
  _id: string;
  auditId: string;
  creatorHandle: string;
  postUrl: string;
  captionText: string;
  transcriptText?: string;
  alignmentScore: number;
  riskScore: number;
  flags: {
    disclosureMissing: boolean;
    competitorMention: string[];
    prohibitedClaims: string[];
  };
  evidence: {
    screenshots: string[];
    audioSnippetUrl?: string;
  };
  recommendedAction: string;
}

// Form input types
export interface CampaignFormData {
  brandName: string;
  brandDescription: string;
  requiredDisclosureTokens: string;  // Comma-separated in form
  competitorKeywords: string;        // Comma-separated in form
  prohibitedClaimKeywords: string;   // Comma-separated in form
  creatorHandles: string;            // Comma-separated in form
}
