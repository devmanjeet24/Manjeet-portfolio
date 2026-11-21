"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface HeroNameProps {
  /** Everything but the last word. */
  first: string;
  /** Last word, set in italic. */
  last: string;
  /** Seconds before the first letter appears. */
  delay?: number;
  id?: string;
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const STEP = 0.045;

/**
 * Display name with a masked, staggered letter reveal: each letter rises out of an
 * overflow-hidden word. The heading has one accessible label; letters are decoration.
 * (MotionConfig reducedMotion="user" makes the reveal instant for reduced-motion users.)
 */
export function HeroName({ first, last, delay = 0.3, id, className }: HeroNameProps) {
  const words = [
    ...first
      .split(/\s+/)
      .filter(Boolean)
      .map((text) => ({ text, italic: false })),
    { text: last, italic: true },
  ];

  let index = 0;
  return (
    <h1
      id={id}
      aria-label={`${first} ${last}`.trim()}
      className={cn(
        "font-display flex flex-wrap justify-center gap-x-[0.22em] leading-[0.95] tracking-tight",
        className,
      )}
    >
      {words.map(({ text, italic }) => {
        const letters = text.split("").map((char) => {
          const i = index++;
          return (
            <motion.span
              key={i}
              aria-hidden
              className="inline-block will-change-transform"
              initial={{ y: "118%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: delay + i * STEP }}
            >
              {char}
            </motion.span>
          );
        });
        return (
          // Padding gives descenders and italic overhang room inside the mask.
          <span
            key={text}
            aria-hidden
            className="-mx-[0.05em] -mb-[0.18em] inline-block overflow-hidden px-[0.05em] pb-[0.18em]"
          >
            {italic ? <em className="italic">{letters}</em> : letters}
          </span>
        );
      })}
    </h1>
  );
}
