import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/cn";

type CardProps<T extends ElementType> = {
  as?: T;
  /** Adds the hover glow + lift; use for clickable/interactive cards. */
  interactive?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

export function Card<T extends ElementType = "div">({
  as,
  interactive = false,
  className,
  ...props
}: CardProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cn(
        "border-border bg-surface-glass rounded-2xl border p-6 backdrop-blur-md transition-all duration-500",
        interactive && "hover:border-accent/40 hover:shadow-glow hover:-translate-y-0.5",
        className,
      )}
      {...props}
    />
  );
}
