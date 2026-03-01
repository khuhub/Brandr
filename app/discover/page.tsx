"use client";

import { useEffect, useMemo, useState } from "react";
import type { Campaign } from "@/lib/types";

type DiscoverCreator = {
  username: string;
  followerCount: string;
  matchPercent: number;
  matchLabel: string;
};

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 4294967296;
  };
}

function getCreatorData(seed: string) {
  const rng = seededRandom(seed);
  return {
    alignment: Math.floor(68 + rng() * 28),
    followers: Math.floor(12 + rng() * 280),
  };
}

function tierStyle(score: number) {
  if (score >= 85) {
    return {
      avatarBg: "from-pink-500 to-rose-400",
      badge: "bg-pink-500 text-white",
      ring: "ring-2 ring-pink-200",
      label: "Top Match",
      labelColor: "text-pink-400",
    };
  }
  if (score >= 72) {
    return {
      avatarBg: "from-rose-400 to-pink-300",
      badge: "bg-rose-400 text-white",
      ring: "ring-2 ring-rose-100",
      label: "Great Match",
      labelColor: "text-rose-400",
    };
  }
  return {
    avatarBg: "from-pink-300 to-rose-200",
    badge: "bg-pink-300 text-white",
    ring: "",
    label: "Good Match",
    labelColor: "text-pink-300",
  };
}

function tierStyleForLabel(matchLabel: string, matchPercent: number) {
  const label = matchLabel.trim().toLowerCase();
  if (label === "top match") {
    return {
      avatarBg: "from-pink-500 to-rose-400",
      badge: "bg-pink-500 text-white",
      ring: "ring-2 ring-pink-200",
      labelColor: "text-pink-400",
    };
  }
  if (label === "great match") {
    return {
      avatarBg: "from-rose-400 to-pink-300",
      badge: "bg-rose-400 text-white",
      ring: "ring-2 ring-rose-100",
      labelColor: "text-rose-400",
    };
  }
  const fallback = tierStyle(matchPercent);
  return {
    avatarBg: fallback.avatarBg,
    badge: fallback.badge,
    ring: fallback.ring,
    labelColor: fallback.labelColor,
  };
}

export default function DiscoverPage() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [phase, setPhase] = useState<"idle" | "showing" | "done">("idle");

  useEffect(() => {
    const stored = localStorage.getItem("brandr_campaign");
    if (stored) {
      try {
        setCampaign(JSON.parse(stored));
      } catch {
        // ignore malformed local storage
      }
    }
  }, []);

  const creators = useMemo<DiscoverCreator[]>(() => {
    if (!campaign) return [];
    return [...campaign.creatorHandles]
      .map((h) => {
        const handle = h.startsWith("@") ? h : `@${h}`;
        const data = getCreatorData(handle + campaign._id);
        const tier = tierStyle(data.alignment);
        return {
          username: handle,
          followerCount: `${data.followers}K`,
          matchPercent: data.alignment,
          matchLabel: tier.label,
        };
      })
      .sort((a, b) => b.matchPercent - a.matchPercent)
      .slice(0, 8);
  }, [campaign]);

  function handleDiscover() {
    setPhase("showing");
    setTimeout(() => setPhase("done"), (creators.length - 1) * 110 + 700);
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-300 via-rose-100 to-pink-50">
        <p className="text-rose-400 font-medium">No campaign found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-rose-100 to-pink-50 relative overflow-hidden">
      <style>{`
        @keyframes bubbleIn {
          0%   { transform: translateY(24px) scale(0.8); opacity: 0; }
          65%  { transform: translateY(-4px) scale(1.03); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes cd1 { 0%,100%{transform:translate(0,0)}  50%{transform:translate(18px,-6px)} }
        @keyframes cd2 { 0%,100%{transform:translate(0,0)}  50%{transform:translate(-14px,5px)} }
        @keyframes cd3 { 0%,100%{transform:translate(0,0)}  50%{transform:translate(10px,8px)}  }
        @keyframes cd4 { 0%,100%{transform:translate(0,0)}  50%{transform:translate(-20px,-4px)} }
        @keyframes cd5 { 0%,100%{transform:translate(0,0)}  50%{transform:translate(16px,6px)}  }
        @keyframes cd6 { 0%,100%{transform:translate(0,0)}  50%{transform:translate(-8px,-8px)}  }
        @keyframes cd7 { 0%,100%{transform:translate(0,0)}  50%{transform:translate(12px,4px)}  }
        .c1{animation:cd1 9s  ease-in-out infinite}
        .c2{animation:cd2 12s ease-in-out 2s   infinite}
        .c3{animation:cd3 8s  ease-in-out 5s   infinite}
        .c4{animation:cd4 14s ease-in-out 1s   infinite}
        .c5{animation:cd5 10s ease-in-out 4s   infinite}
        .c6{animation:cd6 11s ease-in-out 7s   infinite}
        .c7{animation:cd7 7s  ease-in-out 3s   infinite}
      `}</style>

      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="cf" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b" />
              <feColorMatrix
                in="b"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
                result="shaped"
              />
            </filter>
          </defs>

          <g className="c1" filter="url(#cf)" opacity="0.92">
            <circle cx="110" cy="88" r="62" fill="white" />
            <circle cx="172" cy="72" r="55" fill="white" />
            <circle cx="232" cy="85" r="48" fill="white" />
            <circle cx="280" cy="96" r="38" fill="white" />
            <circle cx="150" cy="108" r="50" fill="white" />
            <circle cx="60" cy="102" r="42" fill="white" />
          </g>
          <g className="c2" filter="url(#cf)" opacity="0.88">
            <circle cx="1180" cy="75" r="58" fill="white" />
            <circle cx="1248" cy="60" r="52" fill="white" />
            <circle cx="1310" cy="78" r="46" fill="white" />
            <circle cx="1360" cy="92" r="36" fill="white" />
            <circle cx="1220" cy="98" r="48" fill="white" />
            <circle cx="1140" cy="96" r="40" fill="white" />
          </g>
          <g className="c3" filter="url(#cf)" opacity="0.82">
            <circle cx="660" cy="55" r="48" fill="white" />
            <circle cx="715" cy="44" r="42" fill="white" />
            <circle cx="768" cy="58" r="38" fill="white" />
            <circle cx="695" cy="74" r="44" fill="white" />
            <circle cx="618" cy="70" r="34" fill="white" />
          </g>
          <g className="c4" filter="url(#cf)" opacity="0.78">
            <circle cx="340" cy="155" r="44" fill="white" />
            <circle cx="394" cy="142" r="38" fill="white" />
            <circle cx="444" cy="158" r="34" fill="white" />
            <circle cx="370" cy="174" r="40" fill="white" />
            <circle cx="302" cy="168" r="30" fill="white" />
          </g>
          <g className="c5" filter="url(#cf)" opacity="0.75">
            <circle cx="1040" cy="148" r="46" fill="white" />
            <circle cx="1096" cy="135" r="40" fill="white" />
            <circle cx="1148" cy="150" r="35" fill="white" />
            <circle cx="1070" cy="168" r="42" fill="white" />
            <circle cx="996" cy="162" r="32" fill="white" />
          </g>
          <g className="c6" filter="url(#cf)" opacity="0.68">
            <circle cx="30" cy="420" r="52" fill="white" />
            <circle cx="82" cy="402" r="44" fill="white" />
            <circle cx="128" cy="418" r="36" fill="white" />
            <circle cx="62" cy="440" r="46" fill="white" />
          </g>
          <g className="c7" filter="url(#cf)" opacity="0.65">
            <circle cx="1410" cy="390" r="50" fill="white" />
            <circle cx="1358" cy="374" r="44" fill="white" />
            <circle cx="1312" cy="390" r="36" fill="white" />
            <circle cx="1378" cy="412" r="46" fill="white" />
          </g>
          <g className="c1" filter="url(#cf)" opacity="0.55">
            <circle cx="200" cy="750" r="44" fill="white" />
            <circle cx="254" cy="736" r="38" fill="white" />
            <circle cx="304" cy="752" r="32" fill="white" />
            <circle cx="230" cy="770" r="40" fill="white" />
            <circle cx="158" cy="764" r="30" fill="white" />
          </g>
          <g className="c3" filter="url(#cf)" opacity="0.52">
            <circle cx="1230" cy="760" r="46" fill="white" />
            <circle cx="1286" cy="746" r="40" fill="white" />
            <circle cx="1338" cy="762" r="34" fill="white" />
            <circle cx="1260" cy="780" r="42" fill="white" />
            <circle cx="1186" cy="774" r="32" fill="white" />
          </g>
        </svg>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16 pb-16">
        <div className="text-center mb-12">
          <h1 className="mb-0">
            <button
              onClick={handleDiscover}
              aria-label="Discover creators"
              title="Discover creators"
              className="inline-flex items-center gap-2 text-3xl font-bold text-rose-600 hover:text-rose-700 transition px-3 py-1 rounded-md focus:outline-none group"
            >
              <span>Discover Creators</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-rose-600 opacity-80 transform transition-transform group-hover:translate-x-1"
              >
                <path d="M5 12h14" />
                <path d="M13 5l7 7-7 7" />
              </svg>
            </button>
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-10">
          {creators.map((c, i) => {
            const tier = tierStyleForLabel(c.matchLabel, c.matchPercent);
            const username = c.username.startsWith("@") ? c.username : `@${c.username}`;
            const initials = username.replace("@", "").slice(0, 2).toUpperCase();
            return (
              <div
                key={username}
                style={
                  phase !== "idle"
                    ? {
                        animation: `bubbleIn 0.5s ${i * 110}ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                      }
                    : { opacity: 0, pointerEvents: "none" }
                }
                className={`
                  flex flex-col items-center gap-2.5 p-5
                  rounded-3xl bg-white/60 backdrop-blur-md
                  border border-white/80 shadow-lg
                  ${tier.ring}
                `}
              >
                <div
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${tier.avatarBg} flex items-center justify-center shadow-md flex-shrink-0`}
                >
                  <span className="text-white font-bold text-base tracking-wide">
                    {initials}
                  </span>
                </div>

                <p className="text-sm font-bold text-gray-800 truncate w-full text-center leading-tight">
                  {username}
                </p>

                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tier.badge}`}>
                  {c.matchPercent}% match
                </span>

                <p className="text-xs text-gray-400 leading-none">{c.followerCount} followers</p>

                <p className={`text-[10px] font-semibold uppercase tracking-wide ${tier.labelColor}`}>
                  {c.matchLabel}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
