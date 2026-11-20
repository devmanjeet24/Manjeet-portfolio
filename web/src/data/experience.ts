/**
 * REPLACE WITH REAL DATA
 * Placeholder work history: companies, dates and achievements are fictional.
 */

export interface ExperienceItem {
  company: string;
  role: string;
  /** Human-readable, e.g. "Jan 2024 - Present". */
  period: string;
  location?: string;
  description: string;
  achievements: string[];
  tech: string[];
}

export const experience: ExperienceItem[] = [
  {
    company: "Company Name",
    role: "AI & Full-Stack Developer",
    period: "2024 - Present",
    location: "Remote",
    description:
      "Building AI-powered features and the web applications around them, from retrieval pipelines to production interfaces.",
    achievements: [
      "Shipped a RAG-based assistant that reduced support lookup time significantly",
      "Designed FastAPI services handling streaming LLM responses",
      "Improved Core Web Vitals across the main web app",
    ],
    tech: ["Next.js", "FastAPI", "LangChain", "PostgreSQL"],
  },
  {
    company: "Previous Company",
    role: "Full-Stack Developer",
    period: "2022 - 2024",
    location: "City, Country",
    description:
      "Developed and maintained MERN applications for multiple client products, owning features end to end.",
    achievements: [
      "Delivered several production apps from design handoff to deployment",
      "Introduced code review and CI checks that cut regressions",
      "Mentored junior developers on React and Node.js practices",
    ],
    tech: ["React", "Node.js", "Express", "MongoDB"],
  },
  {
    company: "First Company",
    role: "Junior Web Developer",
    period: "2021 - 2022",
    location: "City, Country",
    description:
      "Built responsive interfaces and REST APIs as part of a small product team.",
    achievements: [
      "Converted design systems into reusable React components",
      "Built REST APIs with authentication and validation",
    ],
    tech: ["JavaScript", "React", "Node.js", "MySQL"],
  },
];
