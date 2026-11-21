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
  /** Hero, top-left label. Sentences separated by periods. */
  heroRoleLine: string;
  /** Hero, vertical list on the left (desktop). */
  focusAreas: string[];
  /** Hero, small caption above the name. */
  heroCaption: string;
  /** Hero, one or two lines under the name. */
  heroDescription: string;
  /** Hero, slow marquee strip along the bottom. */
  marquee: string[];
  /** About: counted-up numbers. The technology count is taken from skills.ts. */
  stats: { yearsOfExperience: number; projectsShipped: number };
  /** About: the "Currently" card. */
  currently: { building: string; learning: string };
}

export const profile: Profile = {
  name: "Manjeet Singh",
  role: "Full-Stack Developer",
  tagline: "Full-stack developer. I build web apps and the backends behind them.",
  shortBio:
    "I build web apps and backend services, mostly with React, Node.js and Python.",
  longBio: [
    "I'm a full-stack developer. I work mostly with React, Node.js and Python, and I like owning a feature from the database all the way to the screen.",
    "I have built web apps, APIs and a few automation tools. I care about code that is easy to read and pages that load fast.",
    "I care about performance, accessibility and clear code, and I like work where design and engineering meet.",
  ],
  location: "City, India",
  email: "hello@example.com",
  socials: [
    { label: "GitHub", url: "https://github.com/your-username", icon: "github" },
    { label: "LinkedIn", url: "https://linkedin.com/in/your-username", icon: "linkedin" },
    { label: "Twitter", url: "https://twitter.com/your-username", icon: "twitter" },
  ],
  resumeUrl: "/resume.pdf",
  availability: "Open to interesting conversations and collaborations.",
  heroRoleLine: "Developer. Engineer. Builder.",
  focusAreas: ["Full-stack", "Backend systems", "Product engineering"],
  heroCaption: "Websites, apps and backends",
  heroDescription:
    "I build websites, web apps and backend services. I like clean code and interfaces that are simple to use.",
  marquee: [
    "Full-stack development",
    "Web apps",
    "APIs and backends",
    "Databases",
    "Clean interfaces",
    "Fast, accessible sites",
  ],
  stats: { yearsOfExperience: 3, projectsShipped: 12 },
  currently: {
    building: "A booking app for a local business, with Next.js and PostgreSQL.",
    learning: "Rust, mostly for fun, and more about database design.",
  },
};
