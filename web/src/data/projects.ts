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
  // ---- Detail page (/projects/[slug]) ----
  /** Your part in it, e.g. "Full-stack developer". */
  role: string;
  /** "The problem": what was wrong before this existed. */
  problem: string;
  /** "My approach": how you went about it. */
  approach: string;
  /** "Key features": shown as a checklist. */
  features: string[];
  /** "Challenges & learnings". */
  challenges: { title: string; text: string }[];
  /** Extra screenshots (paths under /public). Optional: generated mocks are shown until set. */
  gallery?: string[];
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
    role: "Full-stack developer",
    problem:
      "The shop was selling through chat messages and a spreadsheet. Orders got lost, stock counts were wrong, and customers had no way to see where their parcel was.",
    approach:
      "I started with the checkout, since that is where sales are lost, and kept the first version small: products, a cart, card payment and an order list for the owner. Stock and order status came next, once real orders were coming in. The API is a plain Express app on MongoDB, and the cart lives on the server so it survives a refresh.",
    features: [
      "Product catalogue with search and categories",
      "Cart that survives a page refresh",
      "Card payment with order confirmation",
      "Order tracking page for customers",
      "Admin panel for products, stock and orders",
      "Staff accounts with different permissions",
    ],
    challenges: [
      {
        title: "Orders created twice",
        text: "The payment provider can send the same webhook more than once. I stored each event id and made order creation safe to repeat, so a retry never makes a second order.",
      },
      {
        title: "Selling the last item twice",
        text: "Two people could buy the last unit at the same moment. Stock is now reduced in one atomic update that fails when there is not enough left.",
      },
      {
        title: "Slow product pages",
        text: "Listing pages loaded every image at full size. Resized images and pagination cut the first load a lot.",
      },
    ],
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
    role: "Full-stack developer",
    problem:
      "Small teams were juggling a chat app, a shared document and a task list, and none of them agreed with the others. People kept asking what was actually being worked on.",
    approach:
      "Boards and cards first, because that is what people open every day. Comments and live presence came after the basics felt solid. Updates travel over WebSockets, and the server is the single source of truth, so two people editing at once never end up with different boards.",
    features: [
      "Boards with drag-and-drop cards",
      "Comments and mentions on every card",
      "Live presence: see who is online and where",
      "Invite links with owner, member and viewer roles",
      "Keyboard shortcuts for common actions",
      "Activity feed for each board",
    ],
    challenges: [
      {
        title: "Edits that overwrite each other",
        text: "Two people moving the same card produced odd results. Each change now carries a version number, and the server rejects an out-of-date one and sends back the latest state.",
      },
      {
        title: "Dropped connections",
        text: "Laptops sleep and Wi-Fi drops. The client reconnects on its own and asks for what it missed, instead of reloading the whole board.",
      },
      {
        title: "Permissions in two places",
        text: "Hiding a button is not security. Every action is checked on the server against the member's role, and the interface only mirrors that.",
      },
    ],
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
    role: "Full-stack developer, mostly frontend",
    problem:
      'Event data sat in raw collections, so answering a simple question like "how many sign-ups this week?" meant asking a developer to run a query.',
    approach:
      "I worked backwards from the questions people ask most and built charts for those. The heavy lifting is done by MongoDB aggregation pipelines, with results cached for a short time, so filters feel instant. Every view can be saved and shared as a link.",
    features: [
      "Line, bar and table views for the same data",
      "Date range and segment filters",
      "Saved views with shareable links",
      "CSV and PDF export",
      "Loading and empty states that explain themselves",
      "Dark and light themes",
    ],
    challenges: [
      {
        title: "Queries that got slower with data",
        text: "The first pipelines scanned whole collections. Adding the right indexes and filtering as early as possible in the pipeline brought them back to well under a second.",
      },
      {
        title: "Charts with thousands of points",
        text: "Drawing every point made the page sluggish. The server now groups data into buckets that fit the chart's width.",
      },
      {
        title: "Making filters shareable",
        text: "Filter state lives in the URL, so a link recreates the exact view, and the back button works the way people expect.",
      },
    ],
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
    role: "Full-stack developer",
    problem:
      "A growing group lived in a chat that moved too fast. Good answers were buried within a day, and newcomers could not find anything.",
    approach:
      "Profiles, a feed and threaded replies, in that order. The feed is ranked by recent activity, and the busiest queries are cached in Redis so the page stays quick as the content grows. Moderation tools came before launch, not after.",
    features: [
      "Profiles with posts and activity",
      "Ranked feed with infinite scroll",
      "Threaded comments",
      "Notifications with read state",
      "Report and moderation tools",
      "Search across posts and people",
    ],
    challenges: [
      {
        title: "Infinite scroll that stays correct",
        text: "Page numbers break when new posts arrive. I switched to cursor-based pagination, so loading more never repeats or skips a post.",
      },
      {
        title: "Deep comment threads",
        text: 'Loading a thread with hundreds of replies in one go was slow. Replies now load a level at a time, with a "show more" at each branch.',
      },
      {
        title: "A feed that does not repeat itself",
        text: "Caching helped speed, but stale lists confused people. Cache entries are cleared when someone posts or replies.",
      },
    ],
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
    role: "Backend and full-stack developer",
    problem:
      "Long PDFs are hard to search. Keyword search misses a page when it uses different words, and people end up skimming a hundred pages for one answer.",
    approach:
      "Split each file into short passages, store them with their page numbers, and find the passages closest in meaning to a question. The answer is built from those passages, and every one links back to its page so it can be checked. FastAPI handles indexing and search, and a small Next.js interface sits on top.",
    features: [
      "Upload PDFs from the browser",
      "Plain-language questions",
      "Answers that cite the file and page",
      "Search limited to one file or all of them",
      "Indexing progress for large files",
      "Works without signing in for a quick try",
    ],
    challenges: [
      {
        title: "Cutting passages in sensible places",
        text: "Splitting every few hundred words broke sentences in half. Splitting on headings and paragraphs first gave much better matches.",
      },
      {
        title: "Trusting the answers",
        text: "A confident wrong answer is worse than none. If no passage is close enough, the tool says so instead of guessing.",
      },
      {
        title: "Slow first upload",
        text: "Indexing a big file blocked the request. It now runs in the background and the page shows progress.",
      },
    ],
    highlights: [
      "Every answer cites the document and page",
      "Upload and index PDFs from the browser",
      "FastAPI backend with a Next.js interface",
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** The project after this one in the list (wraps around to the first). */
export function getNextProject(slug: string): Project | undefined {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i === -1) return undefined;
  return projects[(i + 1) % projects.length];
}
