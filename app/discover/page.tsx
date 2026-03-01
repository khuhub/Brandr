"use client";

import Link from "next/link";

export default function DiscoverPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">Discover Creators</h1>
      <p className="text-muted-foreground text-sm mb-10">
        Find recommended creators with match scores and estimated ROI.
      </p>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="#f43f5e" opacity="0.15" stroke="#f43f5e" strokeWidth="1" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          AI-powered creator discovery will recommend creators based on brand alignment,
          audience overlap, and estimated ROI potential.
        </p>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
