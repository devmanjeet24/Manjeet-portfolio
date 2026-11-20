"use client";

import { useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PORTRAIT } from "@/lib/portrait-config";
import type { PortraitShape } from "./portrait-particles";
import { PortraitParticlesLazy } from "./portrait-particles-lazy";

/**
 * Temporary: the portrait stays pinned (CSS sticky) while you scroll through a
 * tall section. It holds for a moment, scatters, and rebuilds when you scroll back.
 */
export function PortraitTestView({ alt }: { alt: string }) {
  const [shape, setShape] = useState<PortraitShape>("round");
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress = useTransform(scrollYProgress, [0.1, 0.85], [0, 1], { clamp: true });

  return (
    <section ref={sectionRef} className="relative h-[320vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center gap-5 pt-20 pb-6">
        <div className="flex items-center gap-3">
          <Button
            variant={shape === "round" ? "primary" : "secondary"}
            onClick={() => setShape("round")}
          >
            Round
          </Button>
          <Button
            variant={shape === "square" ? "primary" : "secondary"}
            onClick={() => setShape("square")}
          >
            Square
          </Button>
          <span className="text-muted ml-2 font-mono text-[11px] tracking-[0.22em] uppercase">
            Scroll to scatter
          </span>
        </div>
        <div className="aspect-[960/825] max-h-full min-h-0 w-auto max-w-full flex-1">
          <PortraitParticlesLazy
            alt={alt}
            src={PORTRAIT.src}
            shape={shape}
            progress={progress}
          />
        </div>
      </div>
    </section>
  );
}
