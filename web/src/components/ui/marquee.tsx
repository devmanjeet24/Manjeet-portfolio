import { cn } from "@/lib/cn";

interface MarqueeProps {
  items: readonly string[];
  className?: string;
}

/**
 * Slow, infinite, decorative text strip. The row is duplicated and the track slides
 * by exactly one row, so the loop is seamless. Frozen by the global reduced-motion rule.
 */
export function Marquee({ items, className }: MarqueeProps) {
  const row = (
    <ul className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-8 whitespace-nowrap">
          <span>{item}</span>
          <span aria-hidden className="bg-accent size-1 rounded-full" />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      aria-hidden
      className={cn(
        "text-muted overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] font-mono text-[11px] tracking-[0.22em] uppercase",
        className,
      )}
    >
      <div className="flex w-max animate-[marquee_70s_linear_infinite]">
        {row}
        {row}
      </div>
    </div>
  );
}
