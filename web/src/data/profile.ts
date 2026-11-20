/**
 * REPLACE WITH REAL DATA
 * Personal info used across Home, About, Resume and Contact.
 */

export interface SocialLink {
  label: string;
  url: string;
  /** Matches an icon key handled in the UI layer. */
  icon: "github" | "linkedin" | "twitter" | "mail";
}

export interface Profile {
  name: string;
  role: string;
  tagline: string;
  shortBio: string;
  longBio: string[];
  location: string;
  email: string;
  socials: SocialLink[];
  /** Path under /public or an absolute URL. */
  resumeUrl: string;
  /** Neutral, non-promotional status line. */
  availability: string;
}

export const profile: Profile = {
  name: "Your Name",
  role: "AI & Full-Stack Developer",
  tagline: "Building thoughtful products at the edge of software and intelligence.",
  shortBio:
    "I design and build web applications and AI-powered systems, from polished interfaces to the retrieval pipelines behind them.",
  longBio: [
    "I'm a full-stack developer working across the MERN stack and Python, with a growing focus on applied AI. I enjoy turning ambiguous problems into clear, well-engineered products.",
    "On the AI side I build retrieval-augmented generation systems, conversational agents and automation pipelines using LangChain, vector databases and modern LLM APIs.",
    "I care about performance, accessibility and craft, and I like work where design and engineering meet.",
  ],
  location: "City, Country",
  email: "hello@example.com",
  socials: [
    { label: "GitHub", url: "https://github.com/your-username", icon: "github" },
    { label: "LinkedIn", url: "https://linkedin.com/in/your-username", icon: "linkedin" },
    { label: "Twitter", url: "https://twitter.com/your-username", icon: "twitter" },
  ],
  resumeUrl: "/resume.pdf",
  availability: "Open to interesting conversations and collaborations.",
};
