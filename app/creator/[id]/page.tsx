"use client";

import { useParams } from "next/navigation";

// Page 3: Creator Detail
// TODO (Person 1): Implement creator detail view

export default function CreatorDetailPage() {
  const params = useParams();
  const findingId = params.id;

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">Creator Detail</h1>
      <p className="text-muted-foreground mb-8">
        Finding ID: {findingId}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Content */}
        <div className="space-y-6">
          {/* Caption */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="font-semibold mb-2">Caption</h2>
            <p className="text-muted-foreground">Caption text goes here</p>
          </div>

          {/* Transcript */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="font-semibold mb-2">Transcript</h2>
            <p className="text-muted-foreground">Transcript text goes here</p>
          </div>

          {/* Screenshots */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="font-semibold mb-2">Screenshots</h2>
            <p className="text-muted-foreground">Screenshot gallery goes here</p>
          </div>
        </div>

        {/* Right column: Analysis */}
        <div className="space-y-6">
          {/* Risk Breakdown */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="font-semibold mb-2">Risk Breakdown</h2>
            <p className="text-muted-foreground">Risk details go here</p>
          </div>

          {/* Email Draft */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="font-semibold mb-2">Remediation Email</h2>
            <p className="text-muted-foreground">Email draft goes here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
