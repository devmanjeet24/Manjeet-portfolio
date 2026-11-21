"use client";

import {
  Binary,
  Cpu,
  Database,
  Download,
  FileText,
  Gauge,
  Globe,
  History,
  MessageSquare,
  Save,
  Scissors,
  Search,
  Send,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import type { ArchitectureStep, PipelineIcon } from "@/data/aiProjects";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useViewportProgress } from "@/hooks/use-viewport-progress";
import { cn } from "@/lib/cn";

const ICONS: Record<PipelineIcon, LucideIcon> = {
  upload: Upload,
  scissors: Scissors,
  binary: Binary,
  database: Database,
  search: Search,
  cpu: Cpu,
  message: MessageSquare,
  history: History,
  send: Send,
  save: Save,
  globe: Globe,
  download: Download,
  "file-text": FileText,
  gauge: Gauge,
};

/** A dotted line between two steps. When `on`, the dots move and small particles flow along it. */
function Connector({ on, animate }: { on: boolean; animate: boolean }) {
  const flowing = on && animate;
  const tone = on ? "text-accent" : "text-border-strong";
  return (
    <li
      aria-hidden
      role="presentation"
      className="relative ml-[27px] h-9 w-0.5 shrink-0 lg:mt-[27px] lg:ml-0 lg:h-0.5 lg:w-auto lg:flex-1"
    >
      {/* vertical (phones and tablets) */}
      <span
        className={cn(
          "flow-line-y absolute inset-0 lg:hidden",
          tone,
          flowing && "flow-on",
        )}
      />
      {/* horizontal (desktop) */}
      <span
        className={cn(
          "flow-line-x absolute inset-0 hidden lg:block",
          tone,
          flowing && "flow-on",
        )}
      />
      {flowing
        ? [0, -0.9].map((delay) => (
            <Fragment key={delay}>
              <span
                className="flow-particle-y bg-accent absolute left-1/2 size-1.5 -translate-x-1/2 rounded-full shadow-[0_0_8px_var(--accent)] lg:hidden"
                style={{ animationDelay: `${delay}s` }}
              />
              <span
                className="flow-particle-x bg-accent absolute top-1/2 hidden size-1.5 -translate-y-1/2 rounded-full shadow-[0_0_8px_var(--accent)] lg:block"
                style={{ animationDelay: `${delay}s` }}
              />
            </Fragment>
          ))
        : null}
    </li>
  );
}

interface AiPipelineProps {
  steps: readonly ArchitectureStep[];
}

/**
 * "How it works" diagram. Scrolling past it lights the steps up one after another; hovering,
 * focusing or tapping a step shows (or pins) its explanation.
 */
export function AiPipeline({ steps }: AiPipelineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const descId = useId();
  const reduceMotion = usePrefersReducedMotion();
  const progress = useViewportProgress(ref, { start: 0.9, end: 0.5 });
  const [scrolled, setScrolled] = useState(-1);
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  // Scroll position -> which step is current (state changes only when the step changes).
  useEffect(() => {
    const toIndex = (v: number) =>
      v <= 0.001 ? -1 : Math.min(steps.length - 1, Math.floor(v * steps.length));
    // Pick up the position the page is already at, one frame after mount.
    const frame = requestAnimationFrame(() => setScrolled(toIndex(progress.get())));
    const unsubscribe = progress.on("change", (v) => setScrolled(toIndex(v)));
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, [progress, steps.length]);

  const shown = hover ?? pinned ?? scrolled;
  const step = shown >= 0 ? steps[shown] : null;

  return (
    <div ref={ref} className="space-y-6">
      <ol className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
        {steps.map((s, i) => {
          const Icon = ICONS[s.icon];
          const lit = i <= shown;
          const current = i === shown;
          return (
            <Fragment key={s.title}>
              <li className="flex items-center gap-4 lg:w-24 lg:shrink-0 lg:flex-col lg:gap-3">
                <button
                  type="button"
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  aria-pressed={pinned === i}
                  aria-describedby={descId}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  onClick={() => setPinned((p) => (p === i ? null : i))}
                  className={cn(
                    "relative grid size-14 shrink-0 place-items-center rounded-2xl border backdrop-blur transition-all duration-500",
                    lit
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-border bg-surface-glass text-muted hover:border-border-strong",
                    current && "scale-105 shadow-[0_0_28px_-4px_var(--accent)]",
                  )}
                >
                  <Icon aria-hidden strokeWidth={1.5} className="size-6" />
                  <span
                    aria-hidden
                    className={cn(
                      "bg-background absolute -top-2 -right-2 grid size-5 place-items-center rounded-full border font-mono text-[9px] transition-colors duration-500",
                      lit ? "border-accent/60 text-accent" : "border-border text-muted",
                    )}
                  >
                    {i + 1}
                  </span>
                </button>
                <div className="min-w-0 lg:text-center">
                  <p
                    className={cn(
                      "font-mono text-[10px] tracking-[0.14em] uppercase transition-colors duration-500 md:text-[11px]",
                      lit ? "text-foreground" : "text-muted",
                    )}
                  >
                    {s.title}
                  </p>
                  {/* Phones and tablets: every step explains itself inline */}
                  <p className="text-muted mt-1 text-sm leading-snug lg:hidden">
                    {s.description}
                  </p>
                </div>
              </li>
              {i < steps.length - 1 ? (
                <Connector on={i < shown} animate={!reduceMotion} />
              ) : null}
            </Fragment>
          );
        })}
      </ol>

      {/* Desktop: the highlighted step's explanation */}
      <p
        id={descId}
        aria-live="polite"
        className="border-border text-muted hidden min-h-12 items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-sm lg:flex"
      >
        {step ? (
          <>
            <span className="text-accent font-mono text-[11px] tracking-[0.22em] uppercase">
              {String(shown + 1).padStart(2, "0")} / {step.title}
            </span>
            <span className="text-foreground/90">{step.description}</span>
          </>
        ) : (
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase">
            Scroll, hover or click a step to follow the data
          </span>
        )}
      </p>
    </div>
  );
}
