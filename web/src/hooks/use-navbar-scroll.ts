"use client";

import { useEffect, useState } from "react";

interface NavbarScrollState {
  /** Scrolled away from the top: navbar becomes compact. */
  scrolled: boolean;
  /** Scrolling down past the threshold: navbar hides. */
  hidden: boolean;
}

export function useNavbarScroll(compactAt = 40, hideAfter = 160): NavbarScrollState {
  const [state, setState] = useState<NavbarScrollState>({
    scrolled: false,
    hidden: false,
  });

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      setState((prev) => {
        const scrolled = y > compactAt;
        let hidden = prev.hidden;
        if (y <= hideAfter || delta < -4) hidden = false;
        else if (delta > 4) hidden = true;
        return prev.scrolled === scrolled && prev.hidden === hidden
          ? prev
          : { scrolled, hidden };
      });
      lastY = y;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [compactAt, hideAfter]);

  return state;
}
