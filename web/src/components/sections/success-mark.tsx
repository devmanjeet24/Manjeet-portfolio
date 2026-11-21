"use client";

import { motion } from "framer-motion";

/** A circle that draws itself, then a check inside it. Calm and quick: no confetti. */
export function SuccessMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden fill="none" className={className}>
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, rotate: -90 }}
        animate={{ pathLength: 1, rotate: -90 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "32px 32px" }}
      />
      <motion.path
        d="M20 33.5l8 8L44.5 24"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
