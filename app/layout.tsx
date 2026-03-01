"use client";

import "./globals.css";
import { Manrope } from "next/font/google";

const manrope = Manrope({ subsets: ["latin"] });
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/discover", label: "Discover Creators", icon: "compass" },
  { href: "/campaigns", label: "Past Campaigns", icon: "folder" },
];

function SidebarIcon({ type }: { type: string }) {
  if (type === "grid") return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" /><rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  );
  if (type === "compass") return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" /><polygon points="10,6 6.5,7 6,10 9.5,9" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 13.5V4.5L8 1.5L2 4.5v9l6 3 6-3z" /><path d="M8 1.5v12" />
    </svg>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const isLanding = pathname === "/";
  const isOnboarding = pathname === "/campaigns/new";
  const showSidebar = !isLanding && !isOnboarding;

  const convexClient = useMemo(() => {
    if (!convexUrl) return null;
    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  const appContent = showSidebar ? (
    <div className="min-h-screen bg-background flex">
      <aside className="w-[220px] shrink-0 border-r bg-white flex flex-col h-screen sticky top-0">
        <div className="px-5 py-5 border-b">
          <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
            Brandr
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const isDashActive = item.href === "/dashboard" && (pathname === "/dashboard" || pathname?.startsWith("/creator"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive || isDashActive
                    ? "bg-rose-50 text-rose-600"
                    : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                )}
              >
                <SidebarIcon type={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 min-h-screen overflow-y-auto">{children}</main>
    </div>
  ) : (
    <>{children}</>
  );

  return (
    <html lang="en">
      <body className={manrope.className}>
        {convexClient ? (
          <ConvexProvider client={convexClient}>{appContent}</ConvexProvider>
        ) : (
          appContent
        )}
      </body>
    </html>
  );
}
