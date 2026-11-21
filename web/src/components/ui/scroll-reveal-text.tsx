"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useViewportProgress } from "@/hooks/use-viewport-progress";
import { cn } from "@/lib/cn";

interface ScrollRevealTextProps {
  paragraphs: readonly string[];
  className?: string;
}

/**
 * Paragraphs that light up word by word (opacity 0.2 -> 1) as they scroll through the
 * viewport. One scroll value drives a single CSS variable on the container (no React
 * re-render); each word turns that into its own opacity (see `.reveal-word` in globals.css).
 * The text is always fully readable by screen readers, and fully lit with reduced motion.
 */
export function ScrollRevealText({ paragraphs, className }: ScrollRevealTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const progress = useViewportProgress(ref, { start: 0.88, end: 0.4 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceMotion) {
      el.style.setProperty("--p", "1");
      return;
    }
    el.style.setProperty("--p", String(progress.get()));
    return progress.on("change", (v) => el.style.setProperty("--p", String(v)));
  }, [progress, reduceMotion]);

  const total = paragraphs.reduce((n, p) => n + p.split(/\s+/).filter(Boolean).length, 0);
  let index = 0;

  return (
    <div
      ref={ref}
      className={cn("space-y-6", className)}
      style={{ "--p": 0, "--n": total } as CSSProperties}
    >
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>
          {paragraph
            .split(/\s+/)
            .filter(Boolean)
            .map((word) => {
              const i = index++;
              return (
                <span key={i}>
                  <span className="reveal-word" style={{ "--i": i } as CSSProperties}>
                    {word}
                  </span>{" "}
                </span>
              );
            })}
        </p>
      ))}
    </div>
  );
}
