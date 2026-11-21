"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface MaskedHeadingProps {
  /** Plain words before the italic one. */
  before?: string;
  /** The single emphasised (italic) word. */
  italic: string;
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Serif heading whose words slide up out of a mask when it scrolls into view.
 * (MotionConfig reducedMotion="user" makes the slide instant for reduced-motion users.)
 */
export function MaskedHeading({
  before = "",
  italic,
  as: Tag = "h2",
  id,
  className,
}: MaskedHeadingProps) {
  const words = [
    ...before
      .split(/\s+/)
      .filter(Boolean)
      .map((text) => ({ text, em: false })),
    { text: italic, em: true },
  ];

  return (
    <Tag
      id={id}
      aria-label={`${before} ${italic}`.trim()}
      className={cn(
        "font-display flex flex-wrap gap-x-[0.24em] leading-[1.02] tracking-tight text-balance",
        className,
      )}
    >
      {words.map(({ text, em }, i) => (
        <span
          key={`${text}-${i}`}
          aria-hidden
          className="-mb-[0.18em] inline-block overflow-hidden pb-[0.18em]"
        >
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: "115%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
            transition={{ duration: 0.95, ease: EASE, delay: i * 0.09 }}
          >
            {em ? <em className="text-accent italic">{text}</em> : text}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
