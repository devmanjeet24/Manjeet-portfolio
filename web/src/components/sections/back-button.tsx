"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/** Back to the projects list. A real link, so it also works without JavaScript. */
export function BackButton({ className }: { className?: string }) {
  return (
    <Link
      href="/#projects"
      className={cn(
        "group text-muted hover:text-foreground inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors",
        className,
      )}
    >
      <ArrowLeft
        aria-hidden
        className="size-4 transition-transform duration-300 group-hover:-translate-x-1"
      />
      Back to projects
    </Link>
  );
}
