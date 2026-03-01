"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Campaign } from "@/lib/types";

export default function DashboardPage() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [auditStatus, setAuditStatus] = useState<"idle" | "running" | "done">("idle");

  useEffect(() => {
    const stored = localStorage.getItem("brandr_campaign");
    if (stored) {
      try {
        setCampaign(JSON.parse(stored));
      } catch {
        setCampaign(null);
      }
    }
  }, []);

  function handleRunAudit() {
    if (!campaign) return;
    setAuditStatus("running");
    setTimeout(() => setAuditStatus("done"), 4000);
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
          <h1 className="text-3xl font-bold mb-1">{campaign.brandName}</h1>
          <p className="text-muted-foreground text-sm">Audit Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/campaigns/new"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            New Campaign
          </Link>
          <Link
            href="/campaigns/new?edit=true"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            Edit Campaign
          </Link>
          <button
            onClick={handleRunAudit}
            className="rounded-lg bg-rose-500 text-white px-4 py-2 text-sm font-medium hover:bg-rose-600 transition-colors"
          >
            Run Audit
          </button>
        </div>
      </div>

      {/* Audit status */}
      {auditStatus === "idle" ? (
        <div className="mb-6 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <span className="text-sm font-medium text-muted-foreground">
            No audit run yet — click <span className="text-rose-500">Run Audit</span> to scan {campaign.creatorHandles.length} creator{campaign.creatorHandles.length !== 1 && "s"}
          </span>
        </div>
      ) : (
        <div className={`mb-6 px-4 py-3 rounded-lg border flex items-center gap-3 ${
          auditStatus === "running"
            ? "bg-amber-50 border-amber-200"
            : "bg-emerald-50 border-emerald-200"
        }`}>
          {auditStatus === "running" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-medium text-amber-700">
                Audit running — scanning {campaign.creatorHandles.length} creator{campaign.creatorHandles.length !== 1 && "s"}...
              </span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#22c55e" opacity="0.2" />
                <path d="M4.5 8.5l2.5 2.5 4.5-4.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
          <div className="md:col-span-3 p-4 rounded-lg border bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Brand Description</p>
            <p className="text-sm text-foreground">{campaign.brandDescription}</p>
          </div>
        )}
        {campaign.requiredDisclosureTokens.length > 0 && (
          <div className="p-4 rounded-lg border bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Disclosure Tokens</p>
            <div className="flex flex-wrap gap-1">
              {campaign.requiredDisclosureTokens.map((t) => (
                <span key={t} className="text-xs bg-rose-50 border border-rose-200 text-rose-600 px-2 py-0.5 rounded-md">{t}</span>
              ))}
            </div>
          </div>
        )}
        {campaign.competitorKeywords.length > 0 && (
          <div className="p-4 rounded-lg border bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Competitor Keywords</p>
            <div className="flex flex-wrap gap-1">
              {campaign.competitorKeywords.map((k) => (
                <span key={k} className="text-xs bg-amber-50 border border-amber-200 text-amber-600 px-2 py-0.5 rounded-md">{k}</span>
              ))}
            </div>
          </div>
        )}
        {campaign.prohibitedClaimKeywords.length > 0 && (
          <div className="p-4 rounded-lg border bg-card">
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
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Creator</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alignment</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider" />
            </tr>
          </thead>
          <tbody>
            {campaign.creatorHandles.map((handle) => (
              <tr key={handle} className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-rose-400">
                        {handle.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">@{handle}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {auditStatus === "done" ? (
                    <span className="text-sm font-medium tabular-nums">{Math.floor(60 + Math.random() * 35)}%</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {auditStatus === "done" ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      Math.random() > 0.5
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {Math.random() > 0.5 ? "Low" : "Med"}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {auditStatus === "done" ? (
                    <span className="text-xs text-emerald-600 font-medium">Scanned</span>
                  ) : (
                    <span className="text-xs text-amber-500 font-medium animate-pulse">Scanning...</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/creator/${handle}`}
                    className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    View &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
