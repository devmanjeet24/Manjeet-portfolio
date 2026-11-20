/**
 * REPLACE WITH REAL DATA
 * Placeholder MERN projects: titles, links and images are all fictional.
 */

export interface Project {
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  tech: string[];
  githubUrl?: string;
  liveUrl?: string;
  /** Path under /public/images. */
  image: string;
  featured: boolean;
  year: number;
  category: "Web App" | "E-commerce" | "SaaS" | "Dashboard" | "Social";
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
    image: "/images/projects/commerce-platform.jpg",
    featured: true,
    year: 2025,
    category: "E-commerce",
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
    tech: ["Next.js", "TypeScript", "Socket.IO", "MongoDB", "Tailwind CSS"],
    githubUrl: "https://github.com/your-username/team-workspace",
    liveUrl: "https://example.com/team-workspace",
    image: "/images/projects/team-workspace.jpg",
    featured: true,
    year: 2025,
    category: "SaaS",
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
    tech: ["React", "Express", "MongoDB", "Recharts"],
    githubUrl: "https://github.com/your-username/analytics-dashboard",
    liveUrl: "https://example.com/analytics-dashboard",
    image: "/images/projects/analytics-dashboard.jpg",
    featured: true,
    year: 2024,
    category: "Dashboard",
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
    image: "/images/projects/community-hub.jpg",
    featured: false,
    year: 2024,
    category: "Social",
    highlights: [
      "Cursor-based pagination for infinite feeds",
      "Redis caching for hot content",
      "Notification system with read state",
    ],
  },
  {
    slug: "booking-system",
    title: "Booking System",
    shortDescription: "Appointment scheduling with availability rules and reminders.",
    longDescription:
      "A scheduling app where providers define availability and customers book slots, with calendar sync, email reminders and conflict-free booking logic.",
    tech: ["Next.js", "Node.js", "MongoDB", "Nodemailer"],
    githubUrl: "https://github.com/your-username/booking-system",
    liveUrl: "https://example.com/booking-system",
    image: "/images/projects/booking-system.jpg",
    featured: false,
    year: 2023,
    category: "Web App",
    highlights: [
      "Timezone-aware availability engine",
      "Automated email reminders",
      "Double-booking prevention with atomic updates",
    ],
  },
];
