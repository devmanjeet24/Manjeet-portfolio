/**
 * REPLACE WITH REAL DATA
 * Placeholder projects: titles, text and links are all fictional.
 *
 * Images: leave `image` out and the site draws a generated mock screenshot. When you have a
 * real screenshot, put it in public/images/projects/ and set `image` to its path.
 */

export type ProjectKind = "full-stack" | "frontend" | "ai";

export interface Project {
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  tech: string[];
  githubUrl?: string;
  liveUrl?: string;
  /** Screenshot path under /public (e.g. "/images/projects/shop.jpg"). Optional. */
  image?: string;
  featured: boolean;
  year: number;
  category: "Web App" | "E-commerce" | "SaaS" | "Dashboard" | "Social" | "AI Tool";
  /** Which filter chips the project appears under. */
  kinds: ProjectKind[];
  /** Built with the MERN stack: gets a "MERN" badge. */
  mern: boolean;
  highlights: string[];
}

export const projects: Project[] = [
  {
    slug: "commerce-platform",
    title: "Commerce Platform",
    shortDescription:
      "A full-featured storefront with cart, checkout and an admin panel.",
    longDescription:
      "An end-to-end e-commerce platform with product management, secure payments, order tracking and role-based admin tooling. Built for fast page loads and a frictionless checkout.",
    tech: ["React", "Node.js", "Express", "MongoDB", "Stripe"],
    githubUrl: "https://github.com/your-username/commerce-platform",
    liveUrl: "https://example.com/commerce-platform",
    featured: true,
    year: 2025,
    category: "E-commerce",
    kinds: ["full-stack"],
    mern: true,
    highlights: [
      "Stripe checkout with webhook-driven order fulfilment",
      "Admin dashboard with inventory and sales analytics",
      "JWT auth with role-based access control",
    ],
  },
  {
    slug: "team-workspace",
    title: "Team Workspace",
    shortDescription: "Real-time project and task management for small teams.",
    longDescription:
      "A collaborative workspace with boards, comments and live presence. Changes sync instantly across clients using WebSockets.",
    tech: ["Next.js", "TypeScript", "Node.js", "Express", "Socket.IO", "MongoDB"],
    githubUrl: "https://github.com/your-username/team-workspace",
    liveUrl: "https://example.com/team-workspace",
    featured: true,
    year: 2025,
    category: "SaaS",
    kinds: ["full-stack", "frontend"],
    mern: true,
    highlights: [
      "Real-time updates over WebSockets",
      "Drag-and-drop kanban boards",
      "Invite flow with workspace-level permissions",
    ],
  },
  {
    slug: "analytics-dashboard",
    title: "Analytics Dashboard",
    shortDescription: "Interactive dashboard turning raw event data into clear insights.",
    longDescription:
      "A data dashboard with filterable charts, saved views and CSV export, backed by aggregation pipelines for responsive queries on large datasets.",
    tech: ["React", "Node.js", "Express", "MongoDB", "Recharts"],
    githubUrl: "https://github.com/your-username/analytics-dashboard",
    liveUrl: "https://example.com/analytics-dashboard",
    featured: true,
    year: 2024,
    category: "Dashboard",
    kinds: ["frontend", "full-stack"],
    mern: true,
    highlights: [
      "MongoDB aggregation pipelines for fast queries",
      "Saved filters and shareable views",
      "CSV and PDF export",
    ],
  },
  {
    slug: "community-hub",
    title: "Community Hub",
    shortDescription: "A social platform with profiles, posts and threaded discussions.",
    longDescription:
      "A community app featuring profiles, a ranked feed, threaded comments and notifications, designed to stay performant as content grows.",
    tech: ["React", "Node.js", "Express", "MongoDB", "Redis"],
    githubUrl: "https://github.com/your-username/community-hub",
    featured: false,
    year: 2024,
    category: "Social",
    kinds: ["full-stack"],
    mern: true,
    highlights: [
      "Cursor-based pagination for infinite feeds",
      "Redis caching for hot content",
      "Notification system with read state",
    ],
  },
  {
    slug: "docs-search",
    title: "Docs Search",
    shortDescription:
      "Ask questions about a set of PDFs and get answers that point to the source page.",
    longDescription:
      "A small tool for searching long documents in plain language. Files are split into passages and indexed, and each answer links back to the page it came from.",
    tech: ["Python", "FastAPI", "LangChain", "PostgreSQL", "Next.js"],
    githubUrl: "https://github.com/your-username/docs-search",
    liveUrl: "https://example.com/docs-search",
    featured: false,
    year: 2025,
    category: "AI Tool",
    kinds: ["ai", "full-stack"],
    mern: false,
    highlights: [
      "Every answer cites the document and page",
      "Upload and index PDFs from the browser",
      "FastAPI backend with a Next.js interface",
    ],
  },
];
