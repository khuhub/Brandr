"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Campaign, CreatorFinding, PostFinding } from "@/lib/types";

function getRiskCategory(score: number) {
  // Use more nuanced, slightly muted tones and subtle backgrounds
  if (score < 40) return { label: "Low", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" };
  if (score < 70) return { label: "Medium", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" };
  return { label: "High", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100" };
}

function countFlags(flags: PostFinding["flags"]): number {
  return (flags.disclosureMissing ? 1 : 0) + flags.competitorMention.length + flags.prohibitedClaims.length;
}

function mockCreatorFinding(handle: string, index: number): CreatorFinding {
  const totalRiskScores = [30, 55, 82, 15, 68];
  const totalRiskScore = totalRiskScores[index % totalRiskScores.length];
  const posts: PostFinding[] = [1, 2].map((n) => {
    const riskScore = Math.max(0, Math.min(100, totalRiskScore + (n === 1 ? -5 : 5)));
    return {
      postUrl: `https://www.tiktok.com/@${handle.replace("@", "")}/video/${100000 + index * 10 + n}`,
      captionText: "Just tried the new collection and can't stop wearing it 🔥 Use my code for 10% off. #fashion #style #ad",
      transcriptText: riskScore > 50 ? "Hey guys, the results are honestly insane. Use the link in my bio." : null,
      riskScore,
      flags: {
        disclosureMissing: riskScore > 60,
        competitorMention: riskScore > 50 ? ["competitor"] : [],
        prohibitedClaims: riskScore > 75 ? ["claim"] : [],
      },
      viewCount: "768.2K",
      likeCount: "73.3K",
      brandMentioned: true,
      complianceStatus: riskScore < 40 ? "OK" : "REVIEW",
      detectedKeywords: ["nike", "air max"],
    };
  });
  return {
    creatorHandle: handle.startsWith("@") ? handle : `@${handle}`,
    totalRiskScore,
    posts,
    recommendedAction: totalRiskScore < 40
      ? "No action needed. Content is compliant."
      : totalRiskScore < 70
      ? "Review posts for missing disclosures and competitor mentions."
      : "Immediate action required. Multiple compliance violations detected.",
  };
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const autoRun = searchParams.get("autoRun") === "true";

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [auditStatus, setAuditStatus] = useState<"idle" | "running" | "done">("idle");
  const [riskFilter, setRiskFilter] = useState<"All" | "Low" | "Medium" | "High">("All");

  useEffect(() => {
    const stored = localStorage.getItem("brandr_campaign");
    if (stored) {
      try {
        const c = JSON.parse(stored);
        setCampaign(c);
        const savedStatus = localStorage.getItem(`brandr_audit_status_${c._id}`);
        if (savedStatus === "done") setAuditStatus("done");
      } catch {
        setCampaign(null);
      }
    }
  }, []);

  function persistStatus(status: "idle" | "running" | "done", campaignId: string) {
    setAuditStatus(status);
    if (status === "done") {
      localStorage.setItem(`brandr_audit_status_${campaignId}`, "done");
    } else {
      localStorage.removeItem(`brandr_audit_status_${campaignId}`);
    }
  }

  useEffect(() => {
    if (autoRun && campaign) {
      persistStatus("running", campaign._id);
      const t = setTimeout(() => persistStatus("done", campaign._id), 4000);
      return () => clearTimeout(t);
    }
  }, [autoRun, campaign]);

  function handleRunAudit() {
    if (!campaign) return;
    persistStatus("running", campaign._id);
    setTimeout(() => persistStatus("done", campaign._id), 4000);
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold mb-3">No campaign found</h1>
        <p className="text-muted-foreground mb-6">
          Set up a campaign to start auditing creators.
        </p>
        <Link
          href="/campaigns/new"
          className="rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium shadow-sm hover:bg-foreground/90 transition-colors"
        >
          Create Campaign
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-1 leading-tight">{campaign.brandName}</h1>
          <p className="text-muted-foreground text-sm">Audit Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white border border-gray-200 shadow-sm hover:shadow transition"
          >
            New Campaign
          </Link>
          <Link
            href="/campaigns/edit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white border border-gray-200 shadow-sm hover:shadow transition"
          >
            Edit Campaign
          </Link>
          <button
            onClick={handleRunAudit}
            disabled={auditStatus === "running"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Run Audit
          </button>
        </div>
      </div>

      {/* Audit status */}
      {auditStatus !== "idle" && (
        <div className={`mb-6 px-4 py-3 rounded-md flex items-center gap-3 shadow-sm border-l-4 ${
          auditStatus === "running"
            ? "bg-white border-amber-100 border-l-amber-400"
            : "bg-white border-emerald-100 border-l-emerald-400"
        }`} role="status">
          {auditStatus === "running" ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-medium text-amber-700">
                Audit running — scanning {campaign.creatorHandles.length} creator{campaign.creatorHandles.length !== 1 && "s"}...
              </span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0" aria-hidden>
                <circle cx="9" cy="9" r="8" fill="#d1fae5" />
                <path d="M6 9.5l1.8 1.8L12 7" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium text-emerald-700">
                Audit complete — {campaign.creatorHandles.length} creator{campaign.creatorHandles.length !== 1 && "s"} scanned
              </span>
            </>
          )}
        </div>
      )}

      {/* Campaign summary */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {campaign.brandDescription && (
    <div className="md:col-span-3 p-5 rounded-lg border bg-white shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Brand Description</p>
            <p className="text-sm text-foreground">{campaign.brandDescription}</p>
          </div>
        )}
        {campaign.requiredDisclosureTokens.length > 0 && (
    <div className="p-5 rounded-lg border bg-white shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Disclosure Tokens</p>
            <div className="flex flex-wrap gap-1">
              {campaign.requiredDisclosureTokens.map((t) => (
                <span key={t} className="text-xs bg-rose-50 border border-rose-200 text-rose-600 px-2 py-0.5 rounded-md">{t}</span>
              ))}
            </div>
          </div>
        )}
        {campaign.competitorKeywords.length > 0 && (
    <div className="p-5 rounded-lg border bg-white shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Competitor Keywords</p>
            <div className="flex flex-wrap gap-1">
              {campaign.competitorKeywords.map((k) => (
                <span key={k} className="text-xs bg-amber-50 border border-amber-200 text-amber-600 px-2 py-0.5 rounded-md">{k}</span>
              ))}
            </div>
          </div>
        )}
        {campaign.prohibitedClaimKeywords.length > 0 && (
    <div className="p-5 rounded-lg border bg-white shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Prohibited Claims</p>
            <div className="flex flex-wrap gap-1">
              {campaign.prohibitedClaimKeywords.map((c) => (
                <span key={c} className="text-xs bg-orange-50 border border-orange-200 text-orange-600 px-2 py-0.5 rounded-md">{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Creator table */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground font-medium">Risk:</span>
        {(["All", "Low", "Medium", "High"] as const).map((cat) => {
          const active = riskFilter === cat;
          const colorMap: Record<string, string> = {
            All: active ? "bg-foreground text-background shadow-sm" : "bg-transparent text-muted-foreground hover:bg-gray-100",
            Low: active ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 bg-transparent hover:bg-emerald-50 border-transparent hover:border-emerald-100",
            Medium: active ? "bg-amber-600 text-white shadow-sm" : "text-amber-700 bg-transparent hover:bg-amber-50 border-transparent hover:border-amber-100",
            High: active ? "bg-rose-600 text-white shadow-sm" : "text-rose-700 bg-transparent hover:bg-rose-50 border-transparent hover:border-rose-100",
          };
          return (
            <button
              key={cat}
              onClick={() => setRiskFilter(cat)}
              className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${colorMap[cat]}`}
            >
              {cat}
            </button>
          );
        })}
      </div>

  <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Creator</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Flags</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider" />
            </tr>
          </thead>
          <tbody>
            {campaign.creatorHandles.map((handle, index) => {
              const finding = auditStatus === "done" ? mockCreatorFinding(handle, index) : null;
              const risk = finding ? getRiskCategory(finding.totalRiskScore) : null;
              if (riskFilter !== "All" && (!risk || risk.label !== riskFilter)) return null;
              const flagCount = finding
                ? finding.posts.reduce((sum, p) => sum + countFlags(p.flags), 0)
                : 0;
              const tiktokHandle = handle.startsWith("@") ? handle : `@${handle}`;
              const tiktokUrl = `https://www.tiktok.com/${tiktokHandle}`;

              return (
                <tr key={handle} className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-600">
                          {handle.replace("@", "").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <a
                        href={tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-foreground hover:text-rose-500 transition-colors"
                      >
                        {tiktokHandle}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {finding && risk ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${risk.bg} ${risk.text} ${risk.border}`}>
                          {risk.label}
                        </span>
                      </div>
                    ) : auditStatus === "running" ? (
                      <span className="text-xs text-amber-500 font-medium animate-pulse">Scanning...</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {finding ? (
                      <span className={`text-sm font-semibold tabular-nums ${flagCount > 0 ? "text-rose-600" : "text-muted-foreground"}`}>
                        {flagCount}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/creator/${handle.replace("@", "")}`}
                      className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      View &rarr;
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
