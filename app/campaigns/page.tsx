"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Campaign } from "@/lib/types";

interface StoredCampaign extends Campaign {
  auditResults?: {
    creators: {
      handle: string;
      risk: "Low" | "Medium" | "High";
    }[];
    completedAt: number;
  };
}

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 4294967296;
  };
}

export default function PastCampaignsPage() {
  const [campaigns, setCampaigns] = useState<StoredCampaign[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("brandr_campaigns");
    if (stored) {
      try {
        setCampaigns(JSON.parse(stored));
      } catch {
        setCampaigns([]);
      }
    }
  }, []);

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  function getSimulatedResults(c: StoredCampaign) {
    if (c.auditResults) return c.auditResults;
    const rng = seededRandom(c._id);
    const risks: ("Low" | "Medium" | "High")[] = ["Low", "Medium", "High"];
    return {
      creators: c.creatorHandles.map((handle) => ({
        handle,
        risk: risks[Math.floor(rng() * 2.3)] as "Low" | "Medium" | "High",
      })),
      completedAt: c.createdAt + 4000,
    };
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Past Campaigns</h1>
          <p className="text-muted-foreground text-sm">
            View run statistics from previous campaigns.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Create your first campaign to start auditing creators.
          </p>
          <Link
            href="/campaigns/new"
            className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors"
          >
            Create Campaign &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const isOpen = expanded === c._id;
            const results = getSimulatedResults(c);
            const highRiskCount = results.creators.filter((cr) => cr.risk === "High" || cr.risk === "Medium").length;

            return (
              <div key={c._id} className="rounded-lg border bg-white overflow-hidden">
                <button
                  onClick={() => toggleExpand(c._id)}
                  className="w-full text-left p-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-0.5">
                        {c.brandName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {c.creatorHandles.length} creator{c.creatorHandles.length !== 1 && "s"} &middot; {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">Flagged <span className="font-semibold text-amber-600">{highRiskCount}</span></span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!confirm(`Delete campaign "${c.brandName}"? This cannot be undone.`)) return;
                          const stored = localStorage.getItem("brandr_campaigns");
                          if (!stored) return;
                          try {
                            const arr: StoredCampaign[] = JSON.parse(stored);
                            const next = arr.filter((x) => x._id !== c._id);
                            localStorage.setItem("brandr_campaigns", JSON.stringify(next));
                            setCampaigns(next);
                            // if this was the active campaign, remove it
                            const active = localStorage.getItem("brandr_campaign");
                            if (active) {
                              try {
                                const ac = JSON.parse(active);
                                if (ac._id === c._id) localStorage.removeItem("brandr_campaign");
                              } catch {}
                            }
                          } catch {
                            // ignore
                          }
                        }}
                        aria-label={`Delete ${c.brandName}`}
                        className="text-muted-foreground hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete campaign"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                        </svg>
                      </button>
                      <svg
                        width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                        className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                      >
                        <path d="M4 6l4 4 4-4" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t px-4 pb-4">
                    {c.brandDescription && (
                      <p className="text-xs text-muted-foreground mt-3 mb-3">{c.brandDescription}</p>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <p className="text-2xl font-bold text-foreground">{c.creatorHandles.length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Creators</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">{highRiskCount}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Flagged</p>
                      </div>
                    </div>

                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50/50">
                            <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Creator</th>
                            <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.creators.map((cr) => (
                            <tr key={cr.handle} className="border-b last:border-b-0">
                              <td className="px-3 py-2 text-xs font-medium text-foreground">@{cr.handle}</td>
                              <td className="px-3 py-2">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                  cr.risk === "Low"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : cr.risk === "Medium"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}>
                                  {cr.risk}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {(c.requiredDisclosureTokens.length > 0 || c.competitorKeywords.length > 0 || c.prohibitedClaimKeywords.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {c.requiredDisclosureTokens.map((t) => (
                          <span key={t} className="text-[10px] bg-rose-50 border border-rose-200 text-rose-500 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                        {c.competitorKeywords.map((k) => (
                          <span key={k} className="text-[10px] bg-amber-50 border border-amber-200 text-amber-500 px-1.5 py-0.5 rounded">{k}</span>
                        ))}
                        {c.prohibitedClaimKeywords.map((p) => (
                          <span key={p} className="text-[10px] bg-orange-50 border border-orange-200 text-orange-500 px-1.5 py-0.5 rounded">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
