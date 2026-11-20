"use client";

import { useMotionValue, type MotionValue } from "framer-motion";
import { useEffect, useMemo, type RefObject } from "react";
import { subscribePointer } from "@/lib/pointer";

interface MousePosition {
  /** -1 (left) to 1 (right). */
  x: MotionValue<number>;
  /** -1 (top) to 1 (bottom). */
  y: MotionValue<number>;
}

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/**
 * Normalised pointer position as MotionValues (no re-renders), for parallax:
 *   const { x } = useMousePosition();
 *   const tx = useTransform(x, [-1, 1], [-20, 20]);
 *
 * Relative to the viewport by default, or to `target`'s box when given.
 */
export function useMousePosition(target?: RefObject<HTMLElement | null>): MousePosition {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    return subscribePointer((px, py) => {
      const el = target?.current;
      if (el) {
        const r = el.getBoundingClientRect();
        x.set(clamp(((px - r.left) / r.width) * 2 - 1));
        y.set(clamp(((py - r.top) / r.height) * 2 - 1));
      } else {
        x.set(clamp((px / window.innerWidth) * 2 - 1));
        y.set(clamp((py / window.innerHeight) * 2 - 1));
      }
    });
  }, [target, x, y]);

  return useMemo(() => ({ x, y }), [x, y]);
}
