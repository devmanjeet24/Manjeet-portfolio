"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { SPOTLIGHT_SIZE } from "@/lib/cursor-config";
import { subscribePointer } from "@/lib/pointer";

/** Soft radial glow that trails the cursor. Moves via transform only. */
export function CursorSpotlight({ reduceMotion }: { reduceMotion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const half = SPOTLIGHT_SIZE / 2;
    const duration = reduceMotion ? 0.001 : 0.9;
    const xTo = gsap.quickTo(el, "x", { duration, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration, ease: "power3.out" });
    let ready = false;

    const unsubscribe = subscribePointer((x, y) => {
      if (!ready) {
        ready = true;
        gsap.set(el, { x: x - half, y: y - half });
        el.dataset.ready = "true";
        return;
      }
      xTo(x - half);
      yTo(y - half);
    });

    return () => {
      unsubscribe();
      gsap.killTweensOf(el);
    };
  }, [reduceMotion]);

  return <div ref={ref} aria-hidden className="cursor-spotlight" />;
}
