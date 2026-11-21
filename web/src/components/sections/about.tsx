"use client";

import { motion, type Variants } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { MaskedHeading } from "@/components/ui/masked-heading";
import { ScrollRevealText } from "@/components/ui/scroll-reveal-text";
import { SectionLabel } from "@/components/ui/section-label";
import { profile } from "@/data/profile";
import { skillCategories } from "@/data/skills";
import { AboutPortrait } from "./about-portrait";

const EASE = [0.22, 1, 0.36, 1] as const;

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

const inView = { once: true, margin: "0px 0px -10% 0px" } as const;

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.div variants={item}>
      <Card className="flex h-full flex-col-reverse justify-end gap-2 p-5">
        <dt className="text-muted font-mono text-[10px] tracking-[0.22em] uppercase">
          {label}
        </dt>
        <dd className="font-display text-5xl leading-none tracking-tight md:text-6xl">
          {children}
        </dd>
      </Card>
    </motion.div>
  );
}

/** Pulsing green dot: "live" indicator. */
function LiveDot() {
  return (
    <span aria-hidden className="relative flex size-2.5">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
    </span>
  );
}

export function About() {
  const github = profile.socials.find((s) => s.icon === "github");
  const technologies = skillCategories.reduce((n, c) => n + c.skills.length, 0);

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="border-border relative border-t py-24 md:py-36"
    >
      <Container size="wide">
        <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Left: heading, text, buttons */}
          <div className="space-y-8 lg:col-span-7">
            <SectionLabel index="02">About</SectionLabel>
            <MaskedHeading
              id="about-heading"
              before="A bit about"
              italic="me"
              className="text-5xl md:text-7xl lg:text-8xl"
            />
            <ScrollRevealText
              paragraphs={profile.longBio}
              className="text-foreground max-w-2xl text-lg leading-relaxed md:text-xl"
            />
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button href={profile.resumeUrl} download size="lg" arrow="down" magnetic>
                Download resume
              </Button>
              {github ? (
                <Button
                  href={github.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  size="lg"
                  arrow="up-right"
                >
                  GitHub
                </Button>
              ) : null}
            </div>
          </div>

          {/* Right: image frame, facts, "Currently" */}
          <div className="space-y-4 lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={inView}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <AboutPortrait />
            </motion.div>

            <motion.dl
              variants={list}
              initial="hidden"
              whileInView="show"
              viewport={inView}
              className="grid grid-cols-2 gap-3"
            >
              <Stat label="Years of experience">
                <CountUp value={profile.stats.yearsOfExperience} suffix="+" />
              </Stat>
              <Stat label="Projects shipped">
                <CountUp value={profile.stats.projectsShipped} suffix="+" />
              </Stat>
              <Stat label="Technologies">
                <CountUp value={technologies} />
              </Stat>
              <Stat label="Based in">
                <span className="text-3xl leading-tight md:text-4xl">
                  {profile.location}
                </span>
              </Stat>
            </motion.dl>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={inView}
              transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
            >
              <Card className="space-y-4 p-5">
                <div className="flex items-center gap-2.5">
                  <LiveDot />
                  <p className="text-muted font-mono text-[10px] tracking-[0.22em] uppercase">
                    Currently
                  </p>
                </div>
                <dl className="space-y-3 text-sm leading-relaxed">
                  <div>
                    <dt className="text-accent font-mono text-[10px] tracking-[0.22em] uppercase">
                      Building
                    </dt>
                    <dd className="mt-1">{profile.currently.building}</dd>
                  </div>
                  <div>
                    <dt className="text-accent font-mono text-[10px] tracking-[0.22em] uppercase">
                      Learning
                    </dt>
                    <dd className="mt-1">{profile.currently.learning}</dd>
                  </div>
                </dl>
              </Card>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
