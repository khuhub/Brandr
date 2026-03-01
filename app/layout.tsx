"use client";

import "./globals.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConvexProvider client={convex}>
          <main className="min-h-screen bg-background">
            {children}
          </main>
        </ConvexProvider>
      </body>
    </html>
  );
}
