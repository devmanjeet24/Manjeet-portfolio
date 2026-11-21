"use client";

import { motion } from "framer-motion";
import { education } from "@/data/education";
import { experience } from "@/data/experience";
import { profile } from "@/data/profile";
import { skillCategories } from "@/data/skills";
import { useTilt } from "@/hooks/use-tilt";

function Heading({ children }: { children: string }) {
  return (
    <p className="text-accent mt-[4.5cqw] mb-[1.5cqw] font-mono text-[2.3cqw] tracking-[0.2em] uppercase">
      {children}
    </p>
  );
}

/**
 * A mini resume drawn in HTML from the same data as the rest of the site (so it never drifts
 * from it). Everything is sized in container units, so it scales to any width. It tilts with
 * the pointer, and clicking it opens the full PDF.
 */
export function ResumePreview({ onOpen }: { onOpen: () => void }) {
  const tilt = useTilt(7);
  const jobs = experience.slice(0, 2);
  const degree = education[0];
  const skills = skillCategories.flatMap((c) => c.skills.map((s) => s.name)).slice(0, 10);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      data-cursor="view"
      data-cursor-label="Open"
      aria-label="Open the resume preview"
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 1100 }}
      className="group relative block aspect-[1/1.414] w-full max-w-md text-left"
    >
      {/* paper */}
      <span className="@container absolute inset-0 block overflow-hidden rounded-md bg-[#fbfaf7] text-[#1c1a17] shadow-2xl ring-1 shadow-black/40 ring-black/10 transition-shadow duration-500 group-hover:shadow-[0_40px_80px_-24px_rgba(0,0,0,0.55)]">
        <span className="block h-full p-[8cqw]">
          <span className="bg-accent mb-[3cqw] block h-[1cqw] w-[12cqw] rounded-full" />
          <span className="font-display block text-[9.5cqw] leading-none tracking-tight">
            {profile.name}
          </span>
          <span className="mt-[2cqw] block font-mono text-[2.8cqw] tracking-[0.18em] text-black/60 uppercase">
            {profile.role}
          </span>
          <span className="mt-[1.2cqw] block text-[2.5cqw] text-black/55">
            {profile.email} &middot; {profile.location}
          </span>

          <Heading>Experience</Heading>
          {jobs.map((job) => (
            <span key={`${job.company}-${job.period}`} className="mb-[2.5cqw] block">
              <span className="flex items-baseline justify-between gap-[2cqw] text-[2.8cqw] font-semibold">
                <span>
                  {job.company}
                  <span className="font-normal text-black/60"> &middot; {job.role}</span>
                </span>
                <span className="shrink-0 font-mono text-[2.2cqw] font-normal text-black/50">
                  {job.period}
                </span>
              </span>
              <span className="mt-[0.8cqw] line-clamp-2 block text-[2.4cqw] leading-snug text-black/60">
                {job.achievements[0]}
              </span>
            </span>
          ))}

          <Heading>Skills</Heading>
          <span className="block text-[2.5cqw] leading-relaxed text-black/70">
            {skills.join("  ·  ")}
          </span>

          {degree ? (
            <>
              <Heading>Education</Heading>
              <span className="block text-[2.7cqw] font-semibold">
                {degree.degree}
                <span className="font-normal text-black/60">
                  {" "}
                  &middot; {degree.institution}
                </span>
              </span>
              <span className="mt-[0.8cqw] block font-mono text-[2.2cqw] text-black/50">
                {degree.period}
              </span>
            </>
          ) : null}
        </span>
      </span>
      {/* file tag */}
      <span
        aria-hidden
        className="bg-background border-border text-muted absolute -top-3 -right-3 rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.14em] uppercase"
      >
        PDF
      </span>
    </motion.button>
  );
}
