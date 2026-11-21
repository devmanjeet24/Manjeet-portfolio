"use client";

import { ChevronDown, Plus } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Marquee } from "@/components/ui/marquee";
import { profile } from "@/data/profile";
import { useAnchorNavigation } from "@/hooks/use-anchor-navigation";
import { useMousePosition } from "@/hooks/use-mouse-position";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useSectionProgress } from "@/hooks/use-section-progress";
import { cn } from "@/lib/cn";
import { PORTRAIT, PORTRAIT_FADE_BOTTOM } from "@/lib/portrait-config";
import { HeroName } from "./hero-name";
import { PortraitParticlesLazy } from "./portrait-particles-lazy";
import { ProgressDebug } from "./progress-debug";

const INTRO_SECONDS = 2.6;

/** Fades children in once, on load. (Instant for reduced motion via MotionConfig.) */
function Intro({
  delay,
  className,
  children,
}: {
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Opacity that also switches pointer-events off once a block has faded out. */
function useFade(source: MotionValue<number>, range: [number, number]) {
  const opacity = useTransform(source, range, [1, 0], { clamp: true });
  const pointerEvents = useTransform(opacity, (o) => (o < 0.08 ? "none" : "auto"));
  return { opacity, pointerEvents };
}

/**
 * Home hero. The section is tall and its content is `sticky`: the portrait assembles
 * on load, then crumbles into particles as you scroll and rebuilds when you scroll back.
 * Name and text sit in front of the portrait and drift/fade out as it scatters.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const onAnchorClick = useAnchorNavigation();
  const scroll = useSectionProgress(sectionRef);

  // ---- Particle progress: max(intro assembly, scroll scatter), in ONE stable MotionValue.
  const scrollMapped = useTransform(scroll, [0.1, 0.85], [0, 1], { clamp: true });
  const intro = useMotionValue(1); // 1 = scattered, animates to 0 once particles are ready
  const progress = useMotionValue(1);
  const debugOwns = useRef(false);
  const syncProgress = useCallback(() => {
    if (!debugOwns.current) progress.set(Math.max(intro.get(), scrollMapped.get()));
  }, [intro, progress, scrollMapped]);
  useMotionValueEvent(scrollMapped, "change", syncProgress);
  useMotionValueEvent(intro, "change", syncProgress);
  useEffect(() => {
    if (reduceMotion) intro.set(0);
    syncProgress();
  }, [reduceMotion, intro, syncProgress]);

  const introControls = useRef<ReturnType<typeof animate> | null>(null);
  const startIntro = useCallback(() => {
    introControls.current?.stop();
    if (reduceMotion) {
      intro.set(0);
      return;
    }
    introControls.current = animate(intro, 0, {
      duration: INTRO_SECONDS,
      delay: 0.15,
      ease: [0.45, 0, 0.25, 1],
    });
  }, [intro, reduceMotion]);
  useEffect(() => () => introControls.current?.stop(), []);

  // ---- Mouse parallax: each layer sits at its own depth.
  const mouse = useMousePosition();
  const sx = useSpring(mouse.x, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(mouse.y, { stiffness: 60, damping: 18, mass: 0.6 });
  const nameShift = {
    x: useTransform(sx, [-1, 1], [16, -16]),
    y: useTransform(sy, [-1, 1], [7, -7]),
  };
  const labelShift = {
    x: useTransform(sx, [-1, 1], [6, -6]),
    y: useTransform(sy, [-1, 1], [4, -4]),
  };
  const portraitShift = {
    x: useTransform(sx, [-1, 1], [-14, 14]),
    y: useTransform(sy, [-1, 1], [-9, 9]),
  };
  const still = reduceMotion;

  // ---- Scroll: text drifts up at different speeds and fades as the particles scatter.
  const labelsFade = useFade(scroll, [0.02, 0.18]);
  const nameFade = useFade(scroll, [0.06, 0.4]);
  const textFade = useFade(scroll, [0.03, 0.28]);
  const barFade = useFade(scroll, [0.1, 0.4]);
  const nameY = useTransform(scroll, [0, 0.45], [0, -120]);
  const textY = useTransform(scroll, [0, 0.4], [0, -70]);

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
      <div className={cn("relative h-screen", !reduceMotion && "sticky top-0")}>
        {/* Layer 0: particle portrait, behind everything. */}
        <motion.div
          style={still ? undefined : portraitShift}
          className="pointer-events-none absolute inset-x-0 top-[10svh] z-0 flex h-[50svh] justify-center md:top-[11svh] md:h-[66svh]"
        >
          <div
            // Not clamped to the viewport: on phones the photo's empty left side runs off-screen,
            // so the face can be larger.
            className="h-full max-w-none shrink-0"
            style={{
              aspectRatio: PORTRAIT.aspect,
              // Centre the face (not the image) above the name.
              translate: `${(0.5 - PORTRAIT.faceX) * 100}% 0`,
            }}
          >
            <PortraitParticlesLazy
              alt={`Particle portrait of ${profile.name}`}
              src={PORTRAIT.src}
              progress={progress}
              fadeBottom={PORTRAIT_FADE_BOTTOM}
              onReady={startIntro}
            />
          </div>
        </motion.div>

        {/* Layer 1: labels, name, copy, bottom bar. */}
        <Container
          size="wide"
          className="relative z-10 flex h-full flex-col pt-24 pb-3 md:pt-28"
        >
          {/* Top labels */}
          <motion.div
            style={{ ...labelsFade, ...(still ? {} : labelShift) }}
            className="flex items-start justify-between gap-6 font-mono text-[10px] tracking-[0.22em] uppercase md:text-[11px]"
          >
            <Intro delay={0.9} className="flex items-center gap-2.5">
              <span aria-hidden className="bg-accent size-1.5 rounded-full" />
              <span>{profile.heroRoleLine}</span>
            </Intro>
            <Intro delay={1.0} className="text-muted hidden text-right md:block">
              Based in {profile.location}
            </Intro>
          </motion.div>

          {/* Left vertical list (desktop) */}
          <motion.div
            style={{ ...labelsFade, ...(still ? {} : labelShift) }}
            className="relative hidden flex-1 md:block"
          >
            <Intro delay={1.1} className="absolute top-[22%] left-0 space-y-8">
              <p className="text-muted font-mono text-[11px] tracking-[0.22em] uppercase">
                <span className="text-accent">01</span>
                <span aria-hidden className="mx-2 opacity-50">
                  /
                </span>
                Presence
              </p>
              <div className="space-y-4">
                <Plus aria-hidden className="text-accent size-5" />
                <ul className="text-muted space-y-1.5 font-mono text-[11px] tracking-[0.22em] uppercase">
                  {profile.focusAreas.map((area) => (
                    <li key={area}>{area}</li>
                  ))}
                </ul>
              </div>
            </Intro>
          </motion.div>
          <div className="flex-1 md:hidden" />

          {/* Name + copy, centred at the bottom; the name overlaps the portrait's shoulders. */}
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            <motion.div
              style={{ ...nameFade, ...(still ? {} : { y: nameY }) }}
              className="w-full"
            >
              <motion.div style={still ? undefined : nameShift} className="w-full">
                <Intro delay={0.7}>
                  <p className="text-foreground/70 mb-3 font-mono text-[10px] tracking-[0.22em] uppercase md:mb-4 md:text-[11px]">
                    {profile.heroCaption}
                  </p>
                </Intro>
                <HeroName
                  id="home-heading"
                  first={first}
                  last={last}
                  delay={0.35}
                  className="text-[clamp(3rem,min(13vw,17svh),9.5rem)]"
                />
              </motion.div>
            </motion.div>

            <motion.div
              style={{ ...textFade, ...(still ? {} : { y: textY }) }}
              className="mt-5 flex flex-col items-center gap-6 md:mt-7"
            >
              <Intro delay={1.2} className="[@media(max-height:700px)]:hidden">
                <p className="text-muted max-w-xl text-sm leading-relaxed text-pretty md:text-base">
                  {profile.heroDescription}
                </p>
              </Intro>
              <Intro
                delay={1.35}
                className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
              >
                <Button
                  href="/#projects"
                  variant="secondary"
                  size="lg"
                  arrow="down"
                  magnetic
                  onClick={(e) => onAnchorClick(e, "projects")}
                >
                  Explore my work
                </Button>
                <Button
                  href="/#contact"
                  variant="link"
                  arrow="up-right"
                  onClick={(e) => onAnchorClick(e, "contact")}
                  className="text-[11px]"
                >
                  Start a conversation
                </Button>
              </Intro>
            </motion.div>
          </div>

          {/* Bottom bar: scroll hint + marquee */}
          <motion.div style={barFade} className="mt-6 md:mt-8">
            <Intro
              delay={1.5}
              className="border-border flex items-center gap-6 border-t pt-3"
            >
              <p className="text-muted hidden shrink-0 items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase md:flex">
                Scroll to discover
                <ChevronDown
                  aria-hidden
                  className="text-accent size-4 animate-[chevron-bob_1.8s_ease-in-out_infinite]"
                />
              </p>
              <Marquee items={profile.marquee} className="flex-1" />
            </Intro>
          </motion.div>
        </Container>
      </div>

      <ProgressDebug
        progress={progress}
        onOwnChange={(own) => {
          debugOwns.current = own;
        }}
        onRelease={syncProgress}
      />
    </section>
  );
}
