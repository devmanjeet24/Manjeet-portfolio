"use client";

import { useMotionValue, type MotionValue } from "framer-motion";
import { useEffect, type RefObject } from "react";

/**
 * 0 -> 1 while a tall section scrolls through the viewport (its top reaches the
 * top of the screen at 0, its bottom reaches the bottom of the screen at 1).
 *
 * A plain passive scroll listener, so the value stays correct after instant
 * jumps and while the section is off-screen (unlike element-tracking scroll
 * observers). Lenis drives the native scroll position, so it works with it.
 */
export function useSectionProgress(
  ref: RefObject<HTMLElement | null>,
): MotionValue<number> {
  const progress = useMotionValue(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      progress.set(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref, progress]);

  return progress;
}
