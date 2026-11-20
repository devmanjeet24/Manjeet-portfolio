"use client";

import { usePathname } from "next/navigation";
import { useCallback, type MouseEvent } from "react";
import { useSmoothScroll } from "@/components/layout/smooth-scroll-provider";

/**
 * On the home page, intercepts `/#id` clicks and scrolls smoothly.
 * Elsewhere the normal link navigation to `/#id` takes over.
 */
export function useAnchorNavigation() {
  const pathname = usePathname();
  const { scrollTo } = useSmoothScroll();

  return useCallback(
    (event: MouseEvent<HTMLElement>, id: string, options?: { delay?: number }) => {
      if (pathname !== "/") return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      const go = () => {
        scrollTo(id === "home" ? 0 : `#${id}`);
        window.history.replaceState(null, "", id === "home" ? "/" : `/#${id}`);
      };
      // `delay` lets a scroll lock (e.g. the mobile menu) release first.
      if (options?.delay) window.setTimeout(go, options.delay);
      else go();
    },
    [pathname, scrollTo],
  );
}
