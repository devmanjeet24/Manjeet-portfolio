"use client";

import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSmoothScroll } from "./smooth-scroll-provider";

export function BackToTop() {
  const { scrollTo } = useSmoothScroll();
  return (
    <Button variant="secondary" onClick={() => scrollTo(0, 0)}>
      Back to top
      <ArrowUp aria-hidden className="size-4" />
    </Button>
  );
}
