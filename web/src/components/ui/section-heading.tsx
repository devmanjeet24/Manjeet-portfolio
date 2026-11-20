import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  before?: string;
  /** The single emphasised (italic) word. */
  italic: string;
  after?: string;
  as?: "h1" | "h2" | "h3";
  size?: "xl" | "lg";
} & Omit<ComponentPropsWithoutRef<"h2">, "children">;

const sizes = {
  xl: "text-6xl md:text-8xl",
  lg: "text-4xl md:text-6xl",
} as const;

export function SectionHeading({
  before,
  italic,
  after,
  as: Tag = "h2",
  size = "lg",
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <Tag
      className={cn(
        "font-display leading-[1.02] tracking-tight text-balance",
        sizes[size],
        className,
      )}
      {...props}
    >
      {before ? `${before} ` : null}
      <em className="text-accent italic">{italic}</em>
      {after ? ` ${after}` : null}
    </Tag>
  );
}
