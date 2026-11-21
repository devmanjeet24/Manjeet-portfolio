"use client";

import { useEffect, useRef, useState } from "react";
import type { ExperienceItem } from "@/data/experience";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useViewportProgress } from "@/hooks/use-viewport-progress";
import { cn } from "@/lib/cn";
import { TimelineCard } from "./timeline-card";

/** How far the curve swings from the centre line to each dot (desktop). */
const AMPLITUDE = 36;
/** Dot height inside its row, so it lines up with the card's header. */
const DOT_Y = 44;
/** Below this container width the timeline is a plain vertical line. */
const COMPACT_BELOW = 1024;
/** Reveal a card a little before the pen reaches its dot. */
const LEAD = 0.015;

interface Geometry {
  w: number;
  h: number;
  compact: boolean;
  /** SVG path through every dot. */
  d: string;
  dots: { x: number; y: number }[];
}

/** Reads where each row sits and builds the path that passes through its dot. */
function buildGeometry(container: HTMLElement): Geometry | null {
  const rows = Array.from(container.querySelectorAll<HTMLElement>("[data-exp-row]"));
  if (rows.length === 0) return null;

  const w = container.clientWidth;
  const h = container.clientHeight;
  const compact = w < COMPACT_BELOW;
  const cx = compact ? 12 : w / 2;
  const dots = rows.map((row, i) => ({
    x: compact ? cx : cx + (i % 2 === 0 ? -AMPLITUDE : AMPLITUDE),
    y: row.offsetTop + DOT_Y,
  }));

  if (compact) return { w, h, compact, d: `M ${cx} 0 V ${h}`, dots };

  // S-curves with vertical tangents: centre -> dot 1 -> dot 2 -> ... -> centre.
  let d = `M ${cx} 0`;
  let px = cx;
  let py = 0;
  for (const dot of dots) {
    const mid = (py + dot.y) / 2;
    d += ` C ${px} ${mid}, ${dot.x} ${mid}, ${dot.x} ${dot.y}`;
    px = dot.x;
    py = dot.y;
  }
  const mid = (py + h) / 2;
  d += ` C ${px} ${mid}, ${cx} ${mid}, ${cx} ${h}`;
  return { w, h, compact, d, dots };
}

/**
 * Curved, glowing timeline. The path is drawn as you scroll (stroke-dashoffset); each dot
 * lights up and its card appears when the pen reaches it. On narrow screens it is a straight
 * vertical line. Colours come from theme tokens, so it adapts to light and dark.
 */
export function ExperienceTimeline({ items }: { items: readonly ExperienceItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const thresholds = useRef<number[]>([]);
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [reached, setReached] = useState(0);
  const reduceMotion = usePrefersReducedMotion();
  // Progress 0 when the timeline's top hits 65% of the screen height, 1 when its bottom does.
  const progress = useViewportProgress(containerRef, { start: 0.65, end: 0.65 });

  // Measure (and re-measure on resize or when fonts load).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setGeo(buildGeometry(el)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    void document.fonts?.ready.then(measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  // With a path in the DOM: find where each dot sits along it, then follow the scroll.
  useEffect(() => {
    const path = pathRef.current;
    const glow = glowRef.current;
    if (!geo || !path) return;

    const length = path.getTotalLength();
    // The path only ever moves downward, so a binary search finds each dot's distance.
    thresholds.current = geo.dots.map((dot) => {
      let lo = 0;
      let hi = length;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (path.getPointAtLength(mid).y < dot.y) lo = mid;
        else hi = mid;
      }
      return lo / length;
    });

    for (const p of [path, glow]) if (p) p.style.strokeDasharray = String(length);

    const apply = (value: number) => {
      const v = reduceMotion ? 1 : value;
      const offset = String(length * (1 - v));
      path.style.strokeDashoffset = offset;
      if (glow) glow.style.strokeDashoffset = offset;
      setReached(thresholds.current.filter((t) => v >= t - LEAD).length);
    };

    const frame = requestAnimationFrame(() => apply(progress.get()));
    const unsubscribe = progress.on("change", apply);
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, [geo, progress, reduceMotion]);

  const compact = geo?.compact ?? false;

  return (
    <div ref={containerRef} className="relative">
      {geo ? (
        <>
          <svg
            aria-hidden
            width={geo.w}
            height={geo.h}
            viewBox={`0 0 ${geo.w} ${geo.h}`}
            className="pointer-events-none absolute inset-0 overflow-visible"
          >
            <defs>
              <filter id="exp-glow" x="-50%" y="-5%" width="200%" height="110%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>
            {/* the route, faint, before the pen reaches it */}
            <path
              d={geo.d}
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="2"
              strokeDasharray="2 7"
              strokeLinecap="round"
            />
            {/* glow */}
            <path
              ref={glowRef}
              d={geo.d}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="10"
              opacity="0.55"
              filter="url(#exp-glow)"
              strokeLinecap="round"
              style={{ strokeDashoffset: 0 }}
            />
            {/* the line itself */}
            <path
              ref={pathRef}
              d={geo.d}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ strokeDashoffset: 0 }}
            />
          </svg>

          {geo.dots.map((dot, i) => {
            const on = i < reached;
            const latest = i === reached - 1;
            return (
              <span
                key={i}
                aria-hidden
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: dot.x, top: dot.y }}
              >
                {latest ? (
                  <span className="bg-accent/50 absolute inset-0 animate-ping rounded-full" />
                ) : null}
                <span
                  className={cn(
                    "relative block size-4 rounded-full border-2 transition-all duration-500",
                    on
                      ? "border-accent bg-accent shadow-[0_0_18px_var(--accent)]"
                      : "border-border-strong bg-background",
                  )}
                />
              </span>
            );
          })}
        </>
      ) : null}

      <ol className="space-y-12 lg:space-y-20">
        {items.map((item, i) => (
          <li
            key={`${item.company}-${item.period}`}
            data-exp-row
            className="pl-10 lg:grid lg:grid-cols-2 lg:pl-0"
          >
            <TimelineCard item={item} index={i} reached={i < reached} compact={compact} />
          </li>
        ))}
      </ol>
    </div>
  );
}
