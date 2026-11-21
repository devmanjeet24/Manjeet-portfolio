"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FilterChips } from "@/components/ui/filter-chips";
import { MaskedHeading } from "@/components/ui/masked-heading";
import { SectionLabel } from "@/components/ui/section-label";
import { projects, type ProjectKind } from "@/data/projects";
import { ProjectCard, projectItemVariants } from "./project-card";

type Filter = "all" | ProjectKind;

const CHIPS: readonly { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "full-stack", label: "Full-Stack" },
  { id: "frontend", label: "Frontend" },
  { id: "ai", label: "AI" },
];

const pad = (n: number) => String(n).padStart(2, "0");

export function Projects() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .map((project, index) => ({ project, number: index + 1 }))
      .filter(({ project }) => filter === "all" || project.kinds.includes(filter))
      .filter(
        ({ project }) =>
          !q ||
          `${project.title} ${project.shortDescription} ${project.tech.join(" ")} ${
            project.mern ? "mern" : ""
          }`
            .toLowerCase()
            .includes(q),
      );
  }, [filter, query]);

  const reset = () => {
    setFilter("all");
    setQuery("");
  };

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="border-border relative border-t py-24 md:py-36"
    >
      <Container size="wide" className="space-y-12 md:space-y-16">
        {/* Header: heading on the left; count, filters and search on the right */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-6">
            <SectionLabel index="04">Projects</SectionLabel>
            <MaskedHeading
              id="projects-heading"
              before="Selected"
              italic="work"
              className="text-5xl md:text-7xl lg:text-8xl"
            />
          </div>

          <div className="flex flex-col gap-5 lg:items-end">
            <p className="flex items-baseline gap-3 lg:justify-end">
              <span className="font-display text-5xl leading-none tracking-tight">
                {pad(visible.length)}
              </span>
              <span className="text-muted font-mono text-[11px] tracking-[0.22em] uppercase">
                {visible.length === 1 ? "project" : "projects"}
              </span>
            </p>
            <FilterChips
              chips={CHIPS}
              value={filter}
              onChange={(id) => setFilter(id as Filter)}
              groupId="projects-filter"
              ariaLabel="Filter projects"
              className="lg:justify-end"
            />
            <label className="relative block w-full sm:w-72">
              <span className="sr-only">Search projects</span>
              <Search
                aria-hidden
                className="text-muted pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects"
                className="border-border bg-surface-glass placeholder:text-muted focus:border-accent h-11 w-full rounded-full border pr-10 pl-11 font-mono text-[11px] tracking-[0.14em] uppercase outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="text-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1"
                >
                  <X aria-hidden className="size-4" />
                </button>
              ) : null}
            </label>
          </div>
        </div>

        {/* Alternating large rows; they reorder smoothly when the filter changes */}
        <motion.ul layout className="flex flex-col gap-6 md:gap-10">
          <AnimatePresence mode="popLayout">
            {visible.map(({ project, number }, i) => (
              <motion.li
                key={project.slug}
                layout
                variants={projectItemVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "0px 0px -12% 0px" }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.3 } }}
              >
                <ProjectCard project={project} number={number} reversed={i % 2 === 1} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        {visible.length === 0 ? (
          <div className="border-border flex flex-col items-start gap-4 rounded-3xl border p-8">
            <p className="font-display text-3xl">Nothing matches that.</p>
            <p className="text-muted">Try another filter or a different word.</p>
            <Button variant="secondary" onClick={reset}>
              Show all projects
            </Button>
          </div>
        ) : null}

        {/* Screen readers: announce what the filter or search shows */}
        <p className="sr-only" role="status" aria-live="polite">
          Showing {visible.length} {visible.length === 1 ? "project" : "projects"}
        </p>
      </Container>
    </section>
  );
}
