"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";

/**
 * Sun/Moon swap driven purely by the `dark` class, so there is no
 * hydration mismatch and no icon flash on load.
 */
export function ThemeSwitch({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "text-muted hover:text-foreground relative inline-flex size-9 items-center justify-center rounded-full transition-colors",
        className,
      )}
    >
      <Sun
        aria-hidden
        className="absolute size-[18px] scale-100 rotate-0 transition-all duration-500 dark:scale-0 dark:-rotate-90"
      />
      <Moon
        aria-hidden
        className="absolute size-[18px] scale-0 rotate-90 transition-all duration-500 dark:scale-100 dark:rotate-0"
      />
    </button>
  );
}
