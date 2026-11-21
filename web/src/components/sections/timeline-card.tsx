"use client";

import { motion, type Variants } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { ExperienceItem } from "@/data/experience";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

interface TimelineCardProps {
  item: ExperienceItem;
  index: number;
  /** The timeline's pen has reached this entry's dot. */
  reached: boolean;
  /** Narrow layout: one column, line on the left. */
  compact: boolean;
}

export function TimelineCard({ item, index, reached, compact }: TimelineCardProps) {
  const left = index % 2 === 0;
  const variants: Variants = {
    hidden: { opacity: 0, x: compact ? 0 : left ? -48 : 48, y: compact ? 28 : 12 },
    show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.8, ease: EASE } },
  };

  return (
    <motion.article
      variants={variants}
      initial="hidden"
      animate={reached ? "show" : "hidden"}
      className={cn(
        "bg-surface-glass relative rounded-2xl border p-6 backdrop-blur-md transition-colors duration-700 md:p-8 lg:max-w-xl",
        reached ? "border-accent/40" : "border-border",
        left ? "lg:col-start-1 lg:mr-16 lg:justify-self-end" : "lg:col-start-2 lg:ml-16",
      )}
    >
      {/* short branch from the card to its dot */}
      <span
        aria-hidden
        className={cn(
          "absolute top-11 -left-7 h-px w-7 transition-colors duration-700 lg:hidden",
          reached ? "bg-accent" : "bg-border-strong",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute top-11 hidden h-px w-7 transition-colors duration-700 lg:block",
          left ? "-right-7" : "-left-7",
          reached ? "bg-accent" : "bg-border-strong",
        )}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-accent font-mono text-[11px] tracking-[0.22em] uppercase">
          {item.period}
        </p>
        <Badge variant={item.current ? "accent" : "outline"}>{item.kind}</Badge>
      </div>

      <h3 className="font-display mt-4 text-3xl leading-tight tracking-tight md:text-4xl">
        {item.company}
      </h3>
      <p className="text-muted mt-1 font-mono text-[11px] tracking-[0.14em] uppercase">
        {item.role}
        {item.location ? ` · ${item.location}` : ""}
      </p>

      <p className="text-muted mt-4 leading-relaxed">{item.description}</p>

      <ul className="mt-5 space-y-2.5">
        {item.achievements.slice(0, 3).map((a) => (
          <li key={a} className="flex items-start gap-3 text-sm leading-relaxed">
            <span
              aria-hidden
              className="bg-accent mt-[0.55em] size-1 shrink-0 rounded-full"
            />
            {a}
          </li>
        ))}
      </ul>

      <ul aria-label="Technologies" className="mt-6 flex flex-wrap gap-2">
        {item.tech.map((t) => (
          <li key={t}>
            <Badge>{t}</Badge>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}
