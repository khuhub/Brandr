"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";

interface Point {
  x: number;
  y: number;
}

interface Line {
  from: number;
  to: number;
  mx: number;
  my: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function buildGrid(): Point[] {
  const rand = seededRandom(42);
  const points: Point[] = [];
  const cols = 14;
  const rows = 9;
  const spacingX = 105;
  const spacingY = 90;
  const offsetX = -200;
  const offsetY = -100;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      points.push({
        x: offsetX + c * spacingX + (rand() - 0.5) * 55,
        y: offsetY + r * spacingY + (rand() - 0.5) * 45,
      });
    }
  }
  return points;
}

function buildLines(points: Point[]): Line[] {
  const lines: Line[] = [];
  const threshold = 165;

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < threshold) {
        lines.push({
          from: i,
          to: j,
          mx: (points[i].x + points[j].x) / 2,
          my: (points[i].y + points[j].y) / 2,
        });
      }
    }
  }
  return lines;
}

const GLOW_RADIUS = 150;
const GLOW_RADIUS_SQ = GLOW_RADIUS * GLOW_RADIUS;

export function NetworkVisualization() {
  const svgRef = useRef<SVGSVGElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number>(0);
  const linesRef = useRef<(SVGLineElement | null)[]>([]);

  const points = useMemo(() => buildGrid(), []);
  const lines = useMemo(() => buildLines(points), [points]);

  const pulseLineIndices = useMemo(() => {
    const indices: number[] = [];
    const step = Math.max(1, Math.floor(lines.length / 10));
    for (let i = 0; i < lines.length; i += step) {
      indices.push(i);
    }
    return indices;
  }, [lines]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      mouseRef.current = { x: svgPt.x, y: svgPt.y };
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  useEffect(() => {
    let running = true;

    function tick() {
      if (!running) return;
      const mouse = mouseRef.current;

      for (let i = 0; i < lines.length; i++) {
        const el = linesRef.current[i];
        if (!el) continue;

        if (mouse) {
          const dx = lines[i].mx - mouse.x;
          const dy = lines[i].my - mouse.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < GLOW_RADIUS_SQ) {
            const t = 1 - Math.sqrt(distSq) / GLOW_RADIUS;
            const easedT = t * t;
            el.setAttribute("stroke", "#ffffff");
            el.setAttribute("stroke-opacity", `${0.3 + easedT * 0.7}`);
            el.setAttribute("stroke-width", `${1.2 + easedT * 2}`);
            if (easedT > 0.3) {
              el.setAttribute("filter", "url(#white-glow)");
            } else {
              el.removeAttribute("filter");
            }
            continue;
          }
        }

        el.setAttribute("stroke", "#ffffff");
        el.setAttribute("stroke-opacity", "0.3");
        el.setAttribute("stroke-width", "1.2");
        el.removeAttribute("filter");
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [lines]);

  const setLineRef = useCallback(
    (i: number) => (el: SVGLineElement | null) => {
      linesRef.current[i] = el;
    },
    []
  );

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1100 620"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      style={{ overflow: "visible" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        <filter id="white-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {lines.map((line, i) => (
        <line
          key={i}
          ref={setLineRef(i)}
          x1={points[line.from].x}
          y1={points[line.from].y}
          x2={points[line.to].x}
          y2={points[line.to].y}
          stroke="#ffffff"
          strokeWidth={1.2}
          strokeOpacity={0.3}
        />
      ))}

      {pulseLineIndices.map((li, i) => {
        const line = lines[li];
        if (!line) return null;
        const pathId = `pulse-path-${i}`;
        return (
          <g key={`pulse-${i}`} style={{ pointerEvents: "none" }}>
            <path
              id={pathId}
              d={`M${points[line.from].x},${points[line.from].y} L${points[line.to].x},${points[line.to].y}`}
              fill="none"
              stroke="none"
            />
            <circle r="3.5" fill="white" opacity="0.85" filter="url(#white-glow)">
              <animateMotion
                dur={`${4 + (i % 5) * 1.2}s`}
                repeatCount="indefinite"
                begin={`${(i * 1.7) % 6}s`}
              >
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
