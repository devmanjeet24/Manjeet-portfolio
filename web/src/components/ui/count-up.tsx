"use client";

import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

interface CountUpProps {
  value: number;
  suffix?: string;
  /** Seconds. */
  duration?: number;
}

/**
 * Counts from 0 to `value` the first time it scrolls into view. The final number is always
 * available to screen readers; reduced motion shows it straight away.
 */
export function CountUp({ value, suffix = "", duration = 1.8 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduceMotion = usePrefersReducedMotion();
  const count = useMotionValue(0);
  const text = useTransform(count, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, reduceMotion, count, value, duration]);

  return (
    <span ref={ref}>
      <span aria-hidden>
        <motion.span>{text}</motion.span>
        {suffix}
      </span>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
    </span>
  );
}
