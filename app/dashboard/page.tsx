"use client";

// Page 2: Audit Dashboard
// TODO (Person 1): Implement audit results table

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">Audit Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        View audit results and flagged content
      </p>

      {/* TODO: Audit status header */}
      <div className="mb-6 p-4 border rounded-lg bg-card">
        <p className="text-muted-foreground">Audit status: Running...</p>
      </div>

      {/* TODO: AuditTable component */}
      <div className="border rounded-lg bg-card">
        <p className="p-6 text-muted-foreground">Creator results table goes here</p>
      </div>
    </div>
  );
}
