import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type BadgeProps = {
  variant?: "outline" | "accent";
} & ComponentPropsWithoutRef<"span">;

const variants = {
  outline: "border-border text-muted",
  accent: "border-accent/40 text-accent bg-accent/5",
} as const;

export function Badge({ variant = "outline", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] tracking-wider whitespace-nowrap uppercase",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
