/**
 * REPLACE WITH REAL DATA
 * Placeholder work history: companies, dates and achievements are fictional.
 *
 * Not everything has to be a job. Internships, freelance work, contract work and
 * self-directed projects are all legitimate entries: pick the matching `kind`, and for
 * self-directed work use something honest as the `company`, like "Independent" or
 * "Open source". Keep 2-3 achievements per entry; a short, concrete list reads better
 * than a long one. Order: newest first.
 */

export type ExperienceKind =
  "Full-time" | "Contract" | "Internship" | "Freelance" | "Self-directed" | "Open source";

export interface ExperienceItem {
  company: string;
  role: string;
  /** What kind of engagement this was. Shown as a small tag. */
  kind: ExperienceKind;
  /** Human-readable, e.g. "Jan 2024 - Present". */
  period: string;
  /** Still going on: the period is marked as current. */
  current?: boolean;
  location?: string;
  /** One or two sentences. */
  description: string;
  /** The first three are shown. */
  achievements: string[];
  tech: string[];
}

export const experience: ExperienceItem[] = [
  {
    company: "Company Name",
    role: "Full-Stack Developer",
    kind: "Full-time",
    period: "2024 - Present",
    current: true,
    location: "Remote",
    description:
      "Building features and the web applications around them, from the database to the screen.",
    achievements: [
      "Shipped a search feature that cut the time support staff spend looking things up",
      "Built FastAPI services that stream responses to the web app",
      "Improved page load times across the main application",
    ],
    tech: ["Next.js", "FastAPI", "PostgreSQL", "Docker"],
  },
  {
    company: "Independent",
    role: "Freelance Web Developer",
    kind: "Freelance",
    period: "2023 - 2024",
    location: "Remote",
    description:
      "Built websites and small web apps for local businesses, handling design handoff, development and deployment.",
    achievements: [
      "Delivered five client projects from first call to launch",
      "Set up simple booking and payment flows for two small shops",
      "Wrote handover notes so clients could update content themselves",
    ],
    tech: ["React", "Node.js", "Express", "MongoDB"],
  },
  {
    company: "Company Name",
    role: "Software Engineering Intern",
    kind: "Internship",
    period: "Jun 2022 - Dec 2022",
    location: "City, India",
    description:
      "Worked with a product team on internal tools, fixing bugs and building small features.",
    achievements: [
      "Built an admin screen that replaced a weekly spreadsheet",
      "Added tests around the order flow and caught two regressions before release",
    ],
    tech: ["JavaScript", "React", "Node.js", "MySQL"],
  },
  {
    company: "Open source",
    role: "Self-directed projects",
    kind: "Self-directed",
    period: "2021 - 2022",
    description:
      "Learned by building: small full-stack apps, shared publicly, with code reviews from the community.",
    achievements: [
      "Built and published three apps with working demos",
      "Had pull requests merged into two open source projects",
    ],
    tech: ["JavaScript", "MongoDB", "Git"],
  },
];
