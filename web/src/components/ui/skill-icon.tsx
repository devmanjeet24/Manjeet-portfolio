import {
  Boxes,
  FileSearch,
  MessageSquareText,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import { brandIcons } from "@/data/skill-icons";
import { cn } from "@/lib/cn";

/** Skills with no logo (concepts, not products) get a plain line icon instead. */
const conceptIcons: Record<string, LucideIcon> = {
  rag: FileSearch,
  llm: MessageSquareText,
  "vector-db": Boxes,
  prompt: PenLine,
};

/** Relative luminance (0-1) of a "RRGGBB" colour. */
function luminance(hex: string): number {
  const c = [0, 2, 4].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/**
 * The colour an icon takes on hover. Near-black and near-white brand colours would vanish
 * on one of the two themes, so they use the theme's own foreground colour instead.
 */
export function brandColor(iconKey: string): string {
  const brand = brandIcons[iconKey];
  if (!brand) return "var(--accent)";
  const l = luminance(brand.hex);
  return l < 0.1 || l > 0.85 ? "var(--foreground)" : `#${brand.hex}`;
}

interface SkillIconProps {
  iconKey: string;
  className?: string;
}

/**
 * Monochrome by default (`currentColor`); on hover the parent sets `color: var(--brand)`.
 * Decorative: the skill name is always present as text next to it.
 */
export function SkillIcon({ iconKey, className }: SkillIconProps) {
  const brand = brandIcons[iconKey];
  if (brand) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
        focusable="false"
        className={cn("size-8", className)}
      >
        <path d={brand.path} />
      </svg>
    );
  }
  const Icon = conceptIcons[iconKey] ?? Boxes;
  return <Icon aria-hidden strokeWidth={1.5} className={cn("size-8", className)} />;
}
