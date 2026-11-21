"use client";

import { LayoutGroup, motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface Chip {
  id: string;
  label: string;
  /** Adds a small accent dot (used to highlight a category). */
  accent?: boolean;
}

interface FilterChipsProps {
  chips: readonly Chip[];
  value: string;
  onChange: (id: string) => void;
  /** Unique per instance: scopes the sliding pill animation. */
  groupId: string;
  ariaLabel: string;
  className?: string;
}

/** Pill filter buttons with a sliding active indicator (Framer Motion layout animation). */
export function FilterChips({
  chips,
  value,
  onChange,
  groupId,
  ariaLabel,
  className,
}: FilterChipsProps) {
  return (
    <LayoutGroup id={groupId}>
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn("flex flex-wrap gap-2", className)}
      >
        {chips.map((chip) => {
          const selected = value === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(chip.id)}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors duration-300",
                selected
                  ? "text-background border-transparent"
                  : "border-border text-muted hover:border-border-strong hover:text-foreground",
                !selected && chip.accent && "border-accent/40 text-foreground",
              )}
            >
              {selected ? (
                <motion.span
                  layoutId={`${groupId}-pill`}
                  className="bg-foreground absolute inset-0 rounded-full"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              {chip.accent ? (
                <span aria-hidden className="bg-accent relative size-1.5 rounded-full" />
              ) : null}
              <span className="relative">{chip.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
