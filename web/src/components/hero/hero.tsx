"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionLabel } from "@/components/ui/section-label";
import { Container } from "@/components/ui/container";
import { profile } from "@/data/profile";
import { useAnchorNavigation } from "@/hooks/use-anchor-navigation";
import { cn } from "@/lib/cn";
import { PORTRAIT } from "@/lib/portrait-config";
import { PortraitParticlesLazy } from "./portrait-particles-lazy";

/**
 * Home hero. The section is tall and its content is `sticky`, so scrolling drives
 * the portrait: it holds, crumbles into particles, and rebuilds when you scroll back.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const onAnchorClick = useAnchorNavigation();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress = useTransform(scrollYProgress, [0.1, 0.85], [0, 1], { clamp: true });
  const textOpacity = useTransform(scrollYProgress, [0.04, 0.32], [1, 0], {
    clamp: true,
  });
  const textY = useTransform(scrollYProgress, [0.04, 0.32], [0, -60], { clamp: true });
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0], { clamp: true });

  const words = profile.name.trim().split(/\s+/);
  const last = words.pop() ?? profile.name;
  const first = words.join(" ");

  return (
    <section
      ref={sectionRef}
      id="home"
      aria-labelledby="home-heading"
      className={cn("relative", reduceMotion ? "min-h-screen" : "h-[260vh]")}
    >
      <div
        className={cn(
          "flex h-screen items-center overflow-visible pt-24 pb-10",
          !reduceMotion && "sticky top-0",
        )}
      >
        <Container
          size="wide"
          className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,38fr)_auto] gap-6 md:grid-cols-2 md:grid-rows-1 md:gap-10"
        >
          <div className="flex min-h-0 min-w-0 items-center justify-center self-stretch md:order-2">
            <div
              className="h-full max-h-[72vh] max-w-full"
              style={{ aspectRatio: PORTRAIT.aspect }}
            >
              <PortraitParticlesLazy
                alt={`Particle portrait of ${profile.name}`}
                src={PORTRAIT.src}
                progress={progress}
              />
            </div>
          </div>

          <motion.div
            style={reduceMotion ? undefined : { opacity: textOpacity, y: textY }}
            className="min-w-0 space-y-6 self-center md:order-1"
          >
            <SectionLabel index="01">Presence</SectionLabel>
            <SectionHeading
              as="h1"
              size="xl"
              id="home-heading"
              before={first || undefined}
              italic={last}
              className="text-5xl md:text-7xl lg:text-8xl"
            />
            <p className="text-muted font-mono text-xs tracking-[0.22em] uppercase">
              {profile.role}
            </p>
            <p className="text-muted max-w-md text-base leading-relaxed md:text-lg">
              {profile.tagline}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                href="/#contact"
                arrow="right"
                size="lg"
                magnetic
                onClick={(e) => onAnchorClick(e, "contact")}
              >
                Let&apos;s talk
              </Button>
              <Button
                href="/#projects"
                variant="secondary"
                size="lg"
                onClick={(e) => onAnchorClick(e, "projects")}
              >
                View work
              </Button>
            </div>
          </motion.div>
        </Container>

        <motion.div
          aria-hidden
          style={reduceMotion ? undefined : { opacity: hintOpacity }}
          className="text-muted pointer-events-none absolute inset-x-0 bottom-6 hidden flex-col items-center gap-3 font-mono text-[11px] tracking-[0.22em] uppercase md:flex"
        >
          Scroll to discover
          <span className="bg-border-strong relative block h-10 w-px overflow-hidden">
            <span className="bg-accent absolute inset-x-0 top-0 h-1/2 animate-[hero-scroll_1.8s_ease-in-out_infinite]" />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
