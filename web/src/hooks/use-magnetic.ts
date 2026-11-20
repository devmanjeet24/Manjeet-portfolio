"use client";

import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { useEffect, type RefObject } from "react";
import { MAGNET_RANGE } from "@/lib/cursor-config";
import { subscribePointer } from "@/lib/pointer";
import { useFinePointer } from "./use-fine-pointer";

/**
 * Pulls an element toward the cursor when it gets close, springs back on leave.
 * `strength` is the fraction of the cursor offset applied (0.2-0.4 feels good).
 * No-op on touch devices and with reduced motion.
 */
export function useMagnetic(
  ref: RefObject<HTMLElement | null>,
  strength: number | false,
) {
  const fine = useFinePointer();
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !strength || !fine || reduce) return;

    // Only gsap.to with overwrite "auto". Mixing in quickTo breaks it for good
    // once another tween touches the same property.
    let pulled = false;

    const unsubscribe = subscribePointer((px, py) => {
      const rect = el.getBoundingClientRect();
      // Remove the current offset so the pull does not feed back on itself.
      const cx = rect.left + rect.width / 2 - Number(gsap.getProperty(el, "x"));
      const cy = rect.top + rect.height / 2 - Number(gsap.getProperty(el, "y"));
      const dx = px - cx;
      const dy = py - cy;
      const radius = Math.max(rect.width, rect.height) / 2 + MAGNET_RANGE;

      if (Math.hypot(dx, dy) < radius) {
        pulled = true;
        gsap.to(el, {
          x: dx * strength,
          y: dy * strength,
          duration: 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
      } else if (pulled) {
        pulled = false;
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.9,
          ease: "elastic.out(1, 0.35)",
          overwrite: "auto",
        });
      }
    });

    return () => {
      unsubscribe();
      gsap.killTweensOf(el);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [ref, strength, fine, reduce]);
}
