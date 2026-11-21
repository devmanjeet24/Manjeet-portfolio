"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, PointerEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project } from "@/data/projects";
import { useTilt } from "@/hooks/use-tilt";
import { cn } from "@/lib/cn";
import { ProjectMock } from "./project-mock";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Applied by the parent <li>; the children below inherit and stagger. */
export const projectItemVariants: Variants = {
  hidden: { opacity: 0, y: 56 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE, staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

interface ProjectCardProps {
  project: Project;
  /** Position in the full list, shown as [01]. */
  number: number;
  /** Image on the right, text on the left (alternating layout). */
  reversed?: boolean;
}

export function ProjectCard({ project, number, reversed }: ProjectCardProps) {
  const tilt = useTilt(5);
  const router = useRouter();
  const href = `/projects/${project.slug}`;

  // The whole card opens the detail page. Done with a click handler (not an overlay link)
  // so the image still receives hover, tilt and the cursor's "View" state.
  const open = (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if ((event.target as HTMLElement).closest("a, button, input")) return;
    router.push(href);
  };

  // Feeds the cursor-following gradient border (see `.glow-border` in globals.css).
  const trackGlow = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  const label = String(number).padStart(2, "0");

  return (
    <article
      data-cursor="view"
      onPointerMove={trackGlow}
      onClick={open}
      className="group border-border bg-surface-glass relative grid cursor-pointer items-center gap-6 rounded-3xl border p-4 backdrop-blur-md md:grid-cols-12 md:gap-10 md:p-6"
    >
      <span aria-hidden className="glow-border" />

      {/* Image: zoom and a slight tilt on hover */}
      <motion.div
        variants={rise}
        className={cn("md:col-span-7", reversed && "md:order-2")}
      >
        <motion.div
          onPointerMove={tilt.onPointerMove}
          onPointerLeave={tilt.onPointerLeave}
          style={{
            rotateX: tilt.rotateX,
            rotateY: tilt.rotateY,
            transformPerspective: 1000,
          }}
          className="border-border overflow-hidden rounded-2xl border"
        >
          <div className="transition-transform duration-700 ease-out group-hover:scale-[1.06]">
            {project.image ? (
              <div className="relative aspect-[16/10]">
                <Image
                  src={project.image}
                  alt={`Screenshot of ${project.title}`}
                  fill
                  sizes="(min-width: 768px) 700px, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <ProjectMock project={project} />
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Details */}
      <div className={cn("space-y-5 md:col-span-5", reversed && "md:order-1")}>
        <motion.div
          variants={rise}
          className="flex flex-wrap items-center gap-3 font-mono text-[11px] tracking-[0.22em] uppercase"
        >
          <span className="text-accent">[{label}]</span>
          <span className="text-muted">{project.year}</span>
          {project.mern ? (
            <Badge
              variant="accent"
              title="Built with MongoDB, Express, React and Node.js"
            >
              MERN
            </Badge>
          ) : null}
        </motion.div>

        <motion.h3
          variants={rise}
          className="font-display text-4xl leading-[1.02] tracking-tight text-balance md:text-5xl"
        >
          {project.title}
        </motion.h3>

        <motion.p
          variants={rise}
          className="text-muted text-base leading-relaxed md:text-lg"
        >
          {project.shortDescription}
        </motion.p>

        <motion.ul
          variants={rise}
          aria-label="Technologies"
          className="flex flex-wrap gap-2"
        >
          {project.tech.map((t) => (
            <li key={t}>
              <Badge>{t}</Badge>
            </li>
          ))}
        </motion.ul>

        <motion.div
          variants={rise}
          className="relative z-10 flex flex-wrap items-center gap-3 pt-1"
        >
          {project.liveUrl ? (
            <Button
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              arrow="up-right"
              aria-label={`${project.title}: live demo`}
            >
              Live Demo
            </Button>
          ) : null}
          {project.githubUrl ? (
            <Button
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              arrow="up-right"
              aria-label={`${project.title}: source on GitHub`}
            >
              GitHub
            </Button>
          ) : null}
        </motion.div>

        {/* Keyboard and screen-reader route to the detail page (the card itself is clickable too) */}
        <motion.div variants={rise}>
          <Link
            href={href}
            aria-label={`${project.title}: learn more`}
            className="text-muted hover:text-accent inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors"
          >
            Learn more <span aria-hidden>&rarr;</span>
          </Link>
        </motion.div>
      </div>
    </article>
  );
}
