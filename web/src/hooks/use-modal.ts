"use client";

import { useEffect, type RefObject } from "react";
import { useSmoothScroll } from "@/components/layout/smooth-scroll-provider";

const FOCUSABLE = "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";

interface UseModalOptions {
  open: boolean;
  onClose: () => void;
  /** The dialog element: Tab is kept inside it. */
  containerRef: RefObject<HTMLElement | null>;
  /** Gets focus when the dialog opens. */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Behaviour every modal dialog needs: lock page scroll, close on Escape, keep Tab inside,
 * move focus in on open and put it back on close.
 */
export function useModal({
  open,
  onClose,
  containerRef,
  initialFocusRef,
}: UseModalOptions) {
  const { stop, start } = useSmoothScroll();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    stop();
    html.style.overflow = "hidden";
    initialFocusRef?.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      // Only elements that are actually on screen (not e.g. the hidden fallback inside an <object>).
      const items = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = previousOverflow;
      start();
      previouslyFocused?.focus();
    };
  }, [open, onClose, containerRef, initialFocusRef, stop, start]);
}
