/**
 * REPLACE WITH REAL DATA
 * Skill categories shown in the Skills section.
 */

export interface Skill {
  name: string;
  /** Key resolved to an icon in the UI layer. */
  iconKey: string;
  /** Optional proficiency, 1-5. */
  level?: 1 | 2 | 3 | 4 | 5;
}

export interface SkillCategory {
  id: string;
  title: string;
  /** Short name for the filter chips (defaults to `title`). */
  label?: string;
  skills: Skill[];
}

export const skillCategories: SkillCategory[] = [
  {
    id: "frontend",
    title: "Frontend",
    skills: [
      { name: "React", iconKey: "react", level: 5 },
      { name: "Next.js", iconKey: "nextjs", level: 5 },
      { name: "TypeScript", iconKey: "typescript", level: 4 },
      { name: "Tailwind CSS", iconKey: "tailwind", level: 5 },
      { name: "Framer Motion", iconKey: "framer-motion", level: 4 },
    ],
  },
  {
    id: "backend",
    title: "Backend",
    skills: [
      { name: "Node.js", iconKey: "nodejs", level: 5 },
      { name: "Express", iconKey: "express", level: 5 },
      { name: "Python", iconKey: "python", level: 4 },
      { name: "FastAPI", iconKey: "fastapi", level: 4 },
    ],
  },
  {
    id: "database",
    title: "Database",
    skills: [
      { name: "MongoDB", iconKey: "mongodb", level: 5 },
      { name: "PostgreSQL", iconKey: "postgresql", level: 4 },
    ],
  },
  {
    id: "ai-ml",
    title: "AI / ML",
    label: "AI/ML",
    skills: [
      { name: "LangChain", iconKey: "langchain", level: 4 },
      { name: "RAG", iconKey: "rag", level: 4 },
      { name: "LLM APIs", iconKey: "llm", level: 4 },
      { name: "Vector Databases", iconKey: "vector-db", level: 3 },
      { name: "Prompt Engineering", iconKey: "prompt", level: 4 },
    ],
  },
  {
    id: "devops-tools",
    title: "DevOps & Tools",
    label: "Tools",
    skills: [
      { name: "Git", iconKey: "git", level: 5 },
      { name: "Docker", iconKey: "docker", level: 3 },
      { name: "Vercel", iconKey: "vercel", level: 4 },
      { name: "Render", iconKey: "render", level: 4 },
      { name: "Postman", iconKey: "postman", level: 4 },
    ],
  },
];
