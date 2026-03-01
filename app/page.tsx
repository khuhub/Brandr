"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Heart, Bookmark } from "lucide-react";
import { NetworkVisualization } from "@/components/landing/network-visualization";

function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-baseline gap-2 text-foreground">
          <span className="text-xl md:text-2xl font-semibold tracking-tight">Brandr</span>
          <span className="text-xs font-semibold text-foreground/70 hidden sm:inline">AI Creator Governance</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/campaigns/new"
            className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}

function FadeUp({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=transparent`;
}

const features = [
  {
    handle: "@stella.creates",
    avatar: "stella",
    badgeText: "3 Creators",
    badgeBg: "bg-rose-100 text-rose-700",
    visual: "dashboard" as const,
    title: "Creator Intelligence Dashboard",
    description:
      "Run audits for your active campaign, then review each creator by risk level and total flagged issues in one dashboard.",
  },
  {
    handle: "@lifestyle.jake",
    avatar: "jake",
    badgeText: "2 Flagged",
    badgeBg: "bg-amber-100 text-amber-700",
    visual: "detail" as const,
    title: "Creator Detail View",
    description:
      "Drill into post-level risk scores, disclosure gaps, competitor mentions, prohibited-claim flags, plus caption/transcript context with a recommended action for each creator.",
  },
  {
    handle: "@thecookingco",
    avatar: "cookingco",
    badgeText: "92% Match",
    badgeBg: "bg-emerald-100 text-emerald-700",
    visual: "discover" as const,
    title: "Discover New Creators",
    description:
      "Discover net-new creators across the web who align highly with your brand, then review match scores and follower counts to prioritize outreach.",
  },
];

const steps = [
  {
    num: "01",
    title: "Define Your Campaign",
    description: "Add your brand context, creator handles, required disclosures, competitor keywords, and prohibited claims.",
  },
  {
    num: "02",
    title: "We Audit Creators",
    description: "Run an audit to score creators and surface low, medium, and high-risk profiles with issue counts.",
  },
  {
    num: "03",
    title: "Review & Act",
    description: "Filter by risk, inspect flagged posts in detail, and use Discover to prioritize the best-fit creators.",
  },
];

function DashboardVisual() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <rect x="6" y="8" width="18" height="24" rx="3" fill="#fda4af" opacity="0.5" />
        <rect x="6" y="36" width="18" height="28" rx="3" fill="#fb7185" opacity="0.7" />
        <rect x="27" y="18" width="18" height="14" rx="3" fill="#fda4af" opacity="0.5" />
        <rect x="27" y="36" width="18" height="28" rx="3" fill="#f43f5e" opacity="0.6" />
        <rect x="48" y="4" width="18" height="28" rx="3" fill="#fecdd3" opacity="0.6" />
        <rect x="48" y="36" width="18" height="28" rx="3" fill="#fb7185" opacity="0.8" />
      </svg>
    </div>
  );
}

function DetailVisual() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <circle cx="30" cy="28" r="14" stroke="#f59e0b" strokeWidth="3" fill="#fef3c7" opacity="0.7" />
        <circle cx="30" cy="24" r="5" fill="#f59e0b" opacity="0.5" />
        <path d="M22 33c0-4.4 3.6-6 8-6s8 1.6 8 6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
        <line x1="40" y1="38" x2="54" y2="52" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="54" cy="16" r="4" fill="#f43f5e" opacity="0.6" />
        <path d="M52.5 16l1 1.5 2.5-2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}

function DiscoverVisual() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <circle cx="36" cy="36" r="28" stroke="#fb923c" strokeWidth="2.5" opacity="0.3" />
        <circle cx="36" cy="36" r="18" stroke="#f97316" strokeWidth="2" opacity="0.5" />
        <polygon points="36,14 40,30 36,26 32,30" fill="#f97316" opacity="0.7" />
        <polygon points="36,58 32,42 36,46 40,42" fill="#f97316" opacity="0.7" />
        <polygon points="14,36 30,32 26,36 30,40" fill="#fb923c" opacity="0.6" />
        <polygon points="58,36 42,40 46,36 42,32" fill="#fb923c" opacity="0.6" />
        <circle cx="36" cy="36" r="4" fill="#ea580c" opacity="0.8" />
      </svg>
    </div>
  );
}

function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const pathRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const [showWarning, setShowWarning] = useState(false);

  const pathD = "M 80 60 C 200 20, 300 20, 400 55 C 500 90, 600 90, 720 60";

  useEffect(() => {
    if (!inView) return;
    if (!pathRef.current || !planeRef.current) return;
    const pathEl = pathRef.current as SVGPathElement;
    const planeEl = planeRef.current as SVGGElement;

    const totalLength = pathEl.getTotalLength();
    let raf: number;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let progress = 0;
    let segFrom = 0;
    let segTo = 0;
    let segDur = 0;
    let segStart = 0;
    let wobbling = false;
    let wobbleStart = 0;

    function easeInOut(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function tick(now: number) {
      if (segDur > 0) {
        const t = Math.min((now - segStart) / segDur, 1);
        progress = segFrom + (segTo - segFrom) * easeInOut(t);
        if (t >= 1) segDur = 0;
      }

      const pt = pathEl.getPointAtLength(progress * totalLength);
      const nearby = pathEl.getPointAtLength(Math.min(progress + 0.005, 1) * totalLength);
      let angle = Math.atan2(nearby.y - pt.y, nearby.x - pt.x) * (180 / Math.PI);

      if (wobbling) {
        const wt = (now - wobbleStart) / 1000;
        angle += Math.sin(wt * 14) * 12 * Math.max(0, 1 - wt * 1.2);
      }

      planeEl.setAttribute("transform", `translate(${pt.x}, ${pt.y}) rotate(${angle})`);
      raf = requestAnimationFrame(tick);
    }

    function startSeg(from: number, to: number, dur: number) {
      segFrom = from;
      segTo = to;
      segDur = dur;
      segStart = performance.now();
    }

    function runCycle() {
      progress = 0;
      planeEl.style.opacity = "1";
      startSeg(0, 0.5, 1200);

      timers.push(setTimeout(() => {
        wobbling = true;
        wobbleStart = performance.now();
        setShowWarning(true);
      }, 1200));

      timers.push(setTimeout(() => {
        wobbling = false;
        setShowWarning(false);
        startSeg(0.5, 1, 1200);
      }, 2000));

      timers.push(setTimeout(() => {
        planeEl.style.opacity = "0";
      }, 3200));

      timers.push(setTimeout(runCycle, 3700));
    }

    raf = requestAnimationFrame(tick);
    runCycle();

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [inView]);

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-amber-50/50">
      <div className="container mx-auto px-6" ref={sectionRef}>
        <FadeUp className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Set campaign rules, run audits, and review creators with risk and match visibility.
          </p>
        </FadeUp>

        <div className="relative max-w-3xl mx-auto">
          <div className="hidden md:block relative h-32 mb-4">
            <svg viewBox="0 0 800 120" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              <path
                ref={pathRef}
                d={pathD}
                stroke="#fecdd3"
                strokeWidth="2"
                strokeDasharray="6 4"
                fill="none"
              />
              <circle cx="80" cy="60" r="6" fill="#fda4af" />
              <circle cx="400" cy="55" r="6" fill="#fda4af" />
              <circle cx="720" cy="60" r="6" fill="#fda4af" />

              <g ref={planeRef} style={{ opacity: 0 }}>
                <path d="M-10 7L9 0-10-7-9-1.5l12 1.5-12 1.5z" fill="#f43f5e" opacity="0.85" />
              </g>
            </svg>

            <AnimatePresence>
              {showWarning && (
                <motion.div
                  className="absolute hidden md:flex items-center justify-center"
                  style={{ left: "50%", top: "0px", x: "-50%" }}
                  initial={{ opacity: 0, scale: 0.5, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-amber-100 border border-amber-300 rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L1 21h22L12 2z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
                      <text x="12" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">!</text>
                    </svg>
                    <span className="text-[10px] font-semibold text-amber-700">Flagged</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-rose-200 text-rose-400 font-bold text-sm mb-5 md:hidden">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <FloatingNav />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fda4af] to-[#fecdd3]" />

        <div className="absolute inset-0">
          <NetworkVisualization />
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 45% at 50% 50%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 30%, rgba(255,255,255,0.92) 50%, rgba(255,255,255,0.7) 62%, rgba(255,255,255,0.4) 74%, rgba(255,255,255,0.15) 85%, rgba(255,255,255,0) 100%)",
          }}
        />

        <div className="relative mx-auto px-6 py-32 text-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose-400 mb-4">
              AI Creator Governance
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1] mb-10 max-w-3xl">
              Protect Your Brand Across Every Creator Partnership
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-14 leading-relaxed">
              Automatically audit influencer content for brand safety, compliance,
              and alignment — so you can scale partnerships with confidence.
            </p>
            <div className="flex items-center justify-center gap-4 pointer-events-auto">
              <Link
                href="/campaigns/new"
                className="rounded-lg bg-foreground text-background px-6 py-2.5 text-base font-medium shadow-sm hover:bg-foreground/90 transition-colors"
              >
                Start Auditing
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
              >
                <span>See how it works</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
                  <path d="M5 12h14" />
                  <path d="M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-rose-50/20" />

        <div className="container relative mx-auto px-6">
          <FadeUp className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              Campaign setup, audit review, and creator discovery in one flow
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
              Configure campaign rules, audit creator risk, inspect flagged content, and rank creator fit from one workspace.
          </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FadeUp key={feature.title}>
                <motion.div
                  className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm h-full"
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={avatarUrl(feature.avatar)} alt="" className="w-8 h-8 rounded-full bg-gray-100" />
                      <span className="text-sm font-semibold text-foreground">{feature.handle}</span>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground/50" />
                  </div>

                  <div className="relative h-44 overflow-hidden">
                    {feature.visual === "dashboard" && <DashboardVisual />}
                    {feature.visual === "detail" && <DetailVisual />}
                    {feature.visual === "discover" && <DiscoverVisual />}
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${feature.badgeBg}`}>
                        {feature.badgeText}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 pt-2 pb-1">
                    <div className="flex items-center gap-3">
                      <Heart className="w-[18px] h-[18px] text-foreground/70 cursor-pointer hover:text-rose-500 transition-colors" />
                    </div>
                    <Bookmark className="w-[18px] h-[18px] text-foreground/70 cursor-pointer hover:text-foreground transition-colors" />
                  </div>

                  <div className="px-4 pb-4">
                    <h3 className="text-sm font-bold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorksSection />

      {/* CTA */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <FadeUp>
            <div className="glass rounded-3xl bg-gradient-to-br from-rose-50/80 to-orange-50/60 p-12 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                Ready to safeguard your brand?
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Join forward-thinking brands using Brandr to scale creator
                partnerships without the risk.
              </p>
              <Link
                href="/campaigns/new"
                className="rounded-lg bg-foreground text-background px-6 py-2.5 text-base font-medium shadow-sm hover:bg-foreground/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Brandr</span>
          <span className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Brandr. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
