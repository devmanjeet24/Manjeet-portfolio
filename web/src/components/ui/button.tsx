"use client";

import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRef, type ComponentPropsWithoutRef } from "react";
import { useMagnetic } from "@/hooks/use-magnetic";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "link";
type Size = "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  /** Show a trailing arrow. "up-right" suits external links. */
  arrow?: "right" | "up-right" | "down";
  /** Pull toward the cursor. `true` = 0.3, or pass a strength (0-1). Fine pointers only. */
  magnetic?: boolean | number;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof CommonProps> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof CommonProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-mono uppercase tracking-[0.14em] transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-foreground text-background hover:bg-accent hover:text-accent-foreground",
  secondary:
    "border border-border-strong text-foreground hover:border-accent hover:text-accent",
  ghost: "text-muted hover:text-foreground",
  // Underlined text link: ignores `size`.
  link: "rounded-none border-b border-border-strong pb-1 text-foreground hover:border-accent hover:text-accent",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-[11px]",
  lg: "h-14 px-8 text-xs",
};

export function Button({
  variant = "primary",
  size = "md",
  arrow,
  magnetic,
  className,
  children,
  ...rest
}: ButtonProps) {
  const ref = useRef<HTMLElement | null>(null);
  useMagnetic(ref, magnetic === true ? 0.3 : (magnetic ?? false));
  const classes = cn(
    base,
    variants[variant],
    variant !== "link" && sizes[size],
    className,
  );
  const Arrow =
    arrow === "up-right" ? ArrowUpRight : arrow === "down" ? ArrowDown : ArrowRight;
  const motion =
    arrow === "up-right"
      ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      : arrow === "down"
        ? "group-hover:translate-y-0.5"
        : "group-hover:translate-x-1";
  const content = (
    <>
      {children}
      {arrow ? (
        <Arrow
          aria-hidden
          className={cn("size-4 transition-transform duration-300", motion)}
        />
      ) : null}
    </>
  );

  if (rest.href !== undefined) {
    return (
      <Link ref={(node) => void (ref.current = node)} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  const { type, ...buttonProps } = rest;
  return (
    <button
      ref={(node) => void (ref.current = node)}
      className={classes}
      type={type ?? "button"}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
