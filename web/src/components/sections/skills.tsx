"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { MaskedHeading } from "@/components/ui/masked-heading";
import { Marquee } from "@/components/ui/marquee";
import { SectionLabel } from "@/components/ui/section-label";
import { skillCategories } from "@/data/skills";
import { cn } from "@/lib/cn";
import { SkillCard } from "./skill-card";

/** The category that is highlighted (it is the main differentiator). */
const HIGHLIGHT_ID = "ai-ml";
const ALL = "all";
const EASE = [0.22, 1, 0.36, 1] as const;

export function Skills() {
  const [active, setActive] = useState<string>(ALL);

  const chips = useMemo(
    () => [
      { id: ALL, label: "All" },
      ...skillCategories.map((c) => ({ id: c.id, label: c.label ?? c.title })),
    ],
    [],
  );

  const all = useMemo(
    () =>
      skillCategories.flatMap((c) =>
        c.skills.map((skill) => ({
          ...skill,
          categoryId: c.id,
          category: c.label ?? c.title,
        })),
      ),
    [],
  );

  const visible = active === ALL ? all : all.filter((s) => s.categoryId === active);

  // Two marquee rows from the same list, in opposite directions.
  const names = all.map((s) => s.name);
  const half = Math.ceil(names.length / 2);
  const rowA = names.slice(0, half);
  const rowB = names.slice(half);

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="border-border relative border-t py-24 md:py-36"
    >
      <Container size="wide" className="space-y-12 md:space-y-16">
        <div className="space-y-6">
          <SectionLabel index="03">Skills</SectionLabel>
          <MaskedHeading
            id="skills-heading"
            before="Tools I work"
            italic="with"
            className="text-5xl md:text-7xl lg:text-8xl"
          />
          <p className="text-muted max-w-xl text-base leading-relaxed md:text-lg">
            The languages, frameworks and tools I use most.
          </p>
        </div>

        {/* Filter chips */}
        <LayoutGroup id="skills-filter">
          <div
            role="group"
            aria-label="Filter skills by category"
            className="flex flex-wrap gap-2"
          >
            {chips.map((chip) => {
              const selected = active === chip.id;
              const isAi = chip.id === HIGHLIGHT_ID;
              return (
                <button
                  key={chip.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActive(chip.id)}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors duration-300",
                    selected
                      ? "text-background border-transparent"
                      : "border-border text-muted hover:border-border-strong hover:text-foreground",
                    !selected && isAi && "border-accent/40 text-foreground",
                  )}
                >
                  {selected ? (
                    <motion.span
                      layoutId="skills-chip"
                      className="bg-foreground absolute inset-0 rounded-full"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  {isAi ? (
                    <span
                      aria-hidden
                      className="bg-accent relative size-1.5 rounded-full"
                    />
                  ) : null}
                  <span className="relative">{chip.label}</span>
                </button>
              );
            })}
          </div>

          {/* Grid: cards reorder smoothly when the filter changes */}
          <motion.ul
            layout
            className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((skill) => (
                <motion.li
                  key={skill.name}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <SkillCard
                    name={skill.name}
                    iconKey={skill.iconKey}
                    category={skill.category}
                    highlight={skill.categoryId === HIGHLIGHT_ID}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </LayoutGroup>

        {/* Screen readers: announce what the filter shows */}
        <p className="sr-only" role="status" aria-live="polite">
          Showing {visible.length} {visible.length === 1 ? "skill" : "skills"}
        </p>
      </Container>

      {/* Two marquee rows, opposite directions; pause on hover */}
      <div className="mt-16 space-y-4 md:mt-24 md:space-y-6">
        <Marquee items={rowA} size="lg" pauseOnHover duration={60} />
        <Marquee items={rowB} size="lg" pauseOnHover reverse duration={70} />
      </div>
    </section>
  );
}
