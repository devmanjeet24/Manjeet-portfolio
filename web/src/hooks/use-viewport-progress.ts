"use client";

import { useMotionValue, type MotionValue } from "framer-motion";
import { useEffect, type RefObject } from "react";

interface Options {
  /** Viewport fraction (from the top) where progress is 0: the element's top reaches it. */
  start?: number;
  /** Viewport fraction where progress is 1: the element's bottom reaches it. */
  end?: number;
}

/**
 * 0 -> 1 while an element scrolls up through the viewport. A plain passive scroll
 * listener (works with Lenis, correct after jumps and when off-screen).
 */
export function useViewportProgress(
  ref: RefObject<HTMLElement | null>,
  { start = 0.85, end = 0.35 }: Options = {},
): MotionValue<number> {
  const progress = useMotionValue(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = vh * start - vh * end + rect.height;
      progress.set(Math.min(1, Math.max(0, (vh * start - rect.top) / total)));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref, progress, start, end]);

  return progress;
}
