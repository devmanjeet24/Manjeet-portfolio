import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface MarqueeProps {
  items: readonly string[];
  className?: string;
  /** Scroll right instead of left. */
  reverse?: boolean;
  /** Freeze while the pointer is over the strip. */
  pauseOnHover?: boolean;
  /** "lg" sets items in the display serif. */
  size?: "sm" | "lg";
  /** Seconds for one full loop. */
  duration?: number;
}

/**
 * Slow, infinite, decorative text strip. The row is duplicated and the track slides
 * by exactly one row, so the loop is seamless. Frozen by the global reduced-motion rule.
 * (Animation lives in globals.css `.marquee-track`; speed and direction are CSS variables.)
 */
export function Marquee({
  items,
  className,
  reverse = false,
  pauseOnHover = false,
  size = "sm",
  duration = 70,
}: MarqueeProps) {
  const large = size === "lg";
  const row = (
    <ul className={cn("flex shrink-0 items-center pr-8", large ? "gap-10" : "gap-8")}>
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "flex items-center whitespace-nowrap",
            large ? "gap-10" : "gap-8",
          )}
        >
          <span>{item}</span>
          <span aria-hidden className="bg-accent size-1 shrink-0 rounded-full" />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      aria-hidden
      className={cn(
        "overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]",
        large
          ? "font-display text-foreground/80 text-4xl tracking-tight md:text-5xl"
          : "text-muted font-mono text-[11px] tracking-[0.22em] uppercase",
        pauseOnHover && "marquee-pausable",
        className,
      )}
    >
      <div
        className="marquee-track flex w-max"
        style={
          {
            "--marquee-duration": `${duration}s`,
            "--marquee-direction": reverse ? "reverse" : "normal",
          } as CSSProperties
        }
      >
        {row}
        {row}
      </div>
    </div>
  );
}
