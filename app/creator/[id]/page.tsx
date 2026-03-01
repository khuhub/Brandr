"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { CreatorFinding, PostFinding } from "@/lib/types";

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

function getMockCreatorFinding(handle: string): CreatorFinding {
  const rng = seededRandom(handle);
  const totalRiskScore = Math.floor(rng() * 100);

  const posts: PostFinding[] = [1, 2, 3].map((n) => {
    const riskScore = Math.floor(Math.max(0, Math.min(100, totalRiskScore + (rng() * 30 - 15))));
    const views = (rng() * 900 + 100).toFixed(1);
    const likes = (rng() * 90 + 10).toFixed(1);
    return {
      postUrl: `https://www.tiktok.com/@${handle}/video/${Math.floor(rng() * 9e12 + n)}`,
      captionText: n === 1
        ? `Just tried the new collection and honestly can't stop wearing it 🔥 Use my code for 10% off. #fashion #style #ad`
        : n === 2
        ? `Obsessed with this brand rn, linking everything in my bio. No #ad needed because I genuinely love it 😭`
        : `Day 3 of wearing the same fit because it's that good. @competitor also sent me some stuff but this one wins.`,
      transcriptText: riskScore > 40
        ? `Hey guys, so I've been using this for about two weeks now and the results are honestly insane. Make sure you use the link in my bio to get the discount — it's only valid for the next 48 hours.`
        : null,
      riskScore,
      flags: {
        disclosureMissing: riskScore > 55,
        competitorMention: riskScore > 50 ? ["competitor"] : [],
        prohibitedClaims: riskScore > 75 ? ["guaranteed results", "#1 rated"] : [],
      },
      viewCount: `${views}K`,
      likeCount: `${likes}K`,
      brandMentioned: rng() > 0.2,
      complianceStatus: riskScore < 40 ? "OK" : "REVIEW",
      detectedKeywords: ["nike", "air max", "sponsored"].slice(0, Math.floor(rng() * 3) + 1),
    };
  });

  return {
    creatorHandle: `@${handle}`,
    totalRiskScore,
    posts,
    recommendedAction: totalRiskScore < 40
      ? "No action needed. Content is compliant."
      : totalRiskScore < 70
      ? "Review posts for missing disclosures and competitor mentions. Request updated content."
      : "Immediate action required. Multiple compliance violations detected. Pause partnership pending review.",
  };
}

function getRiskCategory(score: number) {
  // more muted, brand-friendly tones and subtle borders
  if (score < 40) return { label: "Low", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", barColor: "bg-emerald-400" };
  if (score < 70) return { label: "Medium", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", barColor: "bg-amber-400" };
  return { label: "High", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", barColor: "bg-rose-400" };
}

function countFlags(flags: PostFinding["flags"]) {
  return (flags.disclosureMissing ? 1 : 0) + flags.competitorMention.length + flags.prohibitedClaims.length;
}

function FlagRow({ active, activeColor, label, items, emptyText }: {
  active: boolean;
  activeColor: "rose" | "amber";
  label: string;
  items?: string[];
  emptyText: string;
}) {
  const bg = active
    ? activeColor === "rose" ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100"
    : "bg-gray-50 border-gray-100";
  const dotBg = active
    ? activeColor === "rose" ? "bg-rose-500" : "bg-amber-400"
    : "bg-emerald-500";
  const labelColor = active
    ? activeColor === "rose" ? "text-rose-700" : "text-amber-700"
    : "text-gray-600";
  const tagBg = active
    ? activeColor === "rose" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
    : "";

  return (
    <div className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border ${bg}`}>
      <div className={`mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${dotBg}`}>
        {active ? (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 2l4 4M6 2L2 6" />
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 4l2 2 3-3.5" />
          </svg>
        )}
      </div>
      <div>
        <p className={`text-xs font-semibold ${labelColor}`}>{label}</p>
        {items && items.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {items.map((m) => (
              <span key={m} className={`text-[11px] px-1.5 py-0.5 rounded ${tagBg}`}>{m}</span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, index }: { post: PostFinding; index: number }) {
  const risk = getRiskCategory(post.riskScore);
  const flags = countFlags(post.flags);

  return (
    <div className="group rounded-lg bg-white overflow-hidden shadow-sm border hover:shadow-md transition">
      {/* Post header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Post {index + 1}</span>
        <div className="flex items-center gap-2">
          {flags > 0 && (
            <span className="text-xs font-semibold text-rose-600">{flags} flag{flags !== 1 && "s"}</span>
          )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${risk.bg} ${risk.text} ${risk.border}`}>{risk.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 divide-y lg:divide-y-0 lg:divide-x">
        {/* Left: content */}
  <div className="lg:col-span-3 p-6 space-y-5">
          {/* URL */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Video</p>
            <a
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-rose-600 hover:text-rose-700 transition-colors break-all flex items-start gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <path d="M5 2H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V9M8 1h5m0 0v5m0-5L6 8" />
              </svg>
              {post.postUrl}
            </a>
          </div>

          {/* Caption */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Caption</p>
            <p className="text-base text-foreground leading-relaxed">{post.captionText}</p>
          </div>

          {/* Transcript */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Transcript</p>
            {post.transcriptText ? (
              <p className="text-sm text-foreground leading-relaxed">{post.transcriptText}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No transcript available.</p>
            )}
          </div>
        </div>

  {/* Right: metrics + flags */}
  <div className="lg:col-span-2 p-6 space-y-4 lg:-ml-4">
          {/* Risk score */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Risk Score</p>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-2xl font-bold tabular-nums">{post.riskScore}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${risk.bg} ${risk.text} ${risk.border}`}>{risk.label}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-2 ${risk.barColor} transition-all`} style={{ width: `${post.riskScore}%` }} />
            </div>
          </div>

          {/* Flags */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Flags</p>
            <div className="space-y-1.5">
              <FlagRow
                active={post.flags.disclosureMissing}
                activeColor="rose"
                label={post.flags.disclosureMissing ? "Disclosure Missing" : "Disclosure Present"}
                emptyText="Proper disclosure detected"
              />
              <FlagRow
                active={post.flags.competitorMention.length > 0}
                activeColor="amber"
                label={`Competitor Mentions (${post.flags.competitorMention.length})`}
                items={post.flags.competitorMention}
                emptyText="No competitor mentions"
              />
              <FlagRow
                active={post.flags.prohibitedClaims.length > 0}
                activeColor="rose"
                label={`Prohibited Claims (${post.flags.prohibitedClaims.length})`}
                items={post.flags.prohibitedClaims}
                emptyText="No prohibited claims"
              />
            </div>
          </div>

          {/* Stats + keywords */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 7s2-5 6-5 6 5 6 5-2 5-6 5-6-5-6-5z" /><circle cx="7" cy="7" r="1.5" />
              </svg>
              <span className="font-semibold text-foreground">{post.viewCount}</span>
            </span>
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" aria-hidden="true" />
              <span className="font-semibold text-foreground">{post.likeCount}</span>
              <span className="sr-only">Likes: {post.likeCount}</span>
            </span>
          </div>

          {post.detectedKeywords && post.detectedKeywords.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Keywords</p>
              <div className="flex flex-wrap gap-1">
                {post.detectedKeywords.map((kw) => (
                  <span key={kw} className="text-[11px] font-medium bg-gray-100 text-foreground px-2 py-0.5 rounded-full border border-gray-200">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatorDetailPage() {
  const params = useParams();
  const handle = Array.isArray(params.id) ? params.id[0] : params.id as string;
  const creator = getMockCreatorFinding(handle);
  const overallRisk = getRiskCategory(creator.totalRiskScore);
  const totalFlags = creator.posts.reduce((sum, p) => sum + countFlags(p.flags), 0);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-4"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 9L4.5 6l3-3" />
            </svg>
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-600">{handle.slice(0, 2).toUpperCase()}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.tiktok.com/@${handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xl font-bold text-foreground hover:text-rose-500 transition-colors"
                  >
                    @{handle}
                  </a>
                </div>
                <p className="text-sm text-muted-foreground">{creator.posts.length} posts audited</p>
              </div>
            </div>

            {/* Overall risk summary */}
            <div className="flex items-center gap-3 text-sm">
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-0.5">Overall Risk</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tabular-nums">{creator.totalRiskScore}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${overallRisk.bg} ${overallRisk.text} ${overallRisk.border}`}>{overallRisk.label}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-0.5">Total Flags</p>
                <p className={`text-xl font-bold tabular-nums ${totalFlags > 0 ? "text-rose-600" : "text-foreground"}`}>{totalFlags}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Posts — scrollable stack */}
        <div className="space-y-4 mb-6">
          {creator.posts.map((post, i) => (
            <PostCard key={post.postUrl} post={post} index={i} />
          ))}
        </div>

        {/* Recommended Action */}
        <div className={`rounded-md p-5 bg-white shadow-sm border-l-4 ${creator.totalRiskScore >= 70 ? "border-l-rose-300" : creator.totalRiskScore >= 40 ? "border-l-amber-300" : "border-l-emerald-300"}`}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground">Recommended Action</p>
          <p className={`text-sm font-medium text-muted-foreground`}>{creator.recommendedAction}</p>
        </div>
      </div>
    </div>
  );
}
