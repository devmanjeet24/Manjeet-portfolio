import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type SectionLabelProps = {
  /** e.g. "01" */
  index?: string;
} & ComponentPropsWithoutRef<"p">;

export function SectionLabel({
  index,
  className,
  children,
  ...props
}: SectionLabelProps) {
  return (
    <p
      className={cn(
        "text-muted font-mono text-[11px] tracking-[0.22em] uppercase",
        className,
      )}
      {...props}
    >
      {index ? (
        <>
          <span className="text-accent">{index}</span>
          <span aria-hidden className="mx-2 opacity-50">
            /
          </span>
        </>
      ) : null}
      {children}
    </p>
  );
}
