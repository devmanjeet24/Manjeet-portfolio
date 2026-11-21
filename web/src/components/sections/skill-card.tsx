"use client";

import { motion, useSpring } from "framer-motion";
import { useId, useRef, type CSSProperties, type PointerEvent } from "react";
import { brandColor, SkillIcon } from "@/components/ui/skill-icon";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

interface SkillCardProps {
  name: string;
  iconKey: string;
  category: string;
  /** Subtle accent border: used for the AI/ML skills. */
  highlight?: boolean;
}

const TILT_DEGREES = 14;
const SPRING = { stiffness: 220, damping: 18, mass: 0.5 };

/**
 * Glass card for one skill. Follows the pointer with a 3D tilt and a soft glow; shows the
 * brand colour on hover. The name is always visible; a tooltip adds the category on hover
 * and on keyboard focus.
 */
export function SkillCard({ name, iconKey, category, highlight }: SkillCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const reduceMotion = usePrefersReducedMotion();
  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    if (reduceMotion) return;
    rotateY.set((x - 0.5) * TILT_DEGREES);
    rotateX.set((0.5 - y) * TILT_DEGREES);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      tabIndex={0}
      aria-label={`${name}, ${category}`}
      aria-describedby={tooltipId}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onBlur={reset}
      style={
        {
          rotateX,
          rotateY,
          transformPerspective: 700,
          "--brand": brandColor(iconKey),
        } as unknown as CSSProperties
      }
      className={cn(
        "group border-border bg-surface-glass relative flex aspect-[5/4] flex-col items-center justify-center gap-3 rounded-2xl border p-3 backdrop-blur-md transition-[border-color,box-shadow] duration-300 outline-none",
        "hover:border-border-strong focus-visible:border-border-strong",
        highlight &&
          "border-accent/40 hover:border-accent/70 focus-visible:border-accent/70",
        highlight && "shadow-[0_0_30px_-12px_var(--accent-glow)]",
      )}
    >
      {/* Soft glow that follows the cursor */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 [background:radial-gradient(160px_circle_at_var(--mx,50%)_var(--my,50%),color-mix(in_srgb,var(--brand)_22%,transparent),transparent_70%)] group-hover:opacity-100 group-focus-visible:opacity-100"
      />
      <SkillIcon
        iconKey={iconKey}
        className="text-muted relative size-9 transition-colors duration-300 group-hover:text-[var(--brand)] group-focus-visible:text-[var(--brand)] md:size-10"
      />
      <span className="text-foreground/85 relative text-center font-mono text-[10px] leading-tight tracking-[0.14em] uppercase md:text-[11px]">
        {name}
      </span>

      {/* Tooltip: hover and keyboard focus */}
      <span
        id={tooltipId}
        role="tooltip"
        className="border-border-strong bg-background text-foreground pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full rounded-lg border px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] whitespace-nowrap uppercase opacity-0 shadow-lg shadow-black/20 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {name}
        <span className="text-muted"> · {category}</span>
      </span>
    </motion.div>
  );
}
