/**
 * REPLACE WITH REAL DATA
 * Placeholder AI projects: architecture steps, links and summaries are fictional.
 */

export interface ArchitectureStep {
  title: string;
  description: string;
}

export interface AIProject {
  slug: string;
  title: string;
  summary: string;
  problem: string;
  solution: string;
  /** Ordered pipeline shown as a diagram/timeline. */
  steps: ArchitectureStep[];
  tech: string[];
  githubUrl?: string;
  demoUrl?: string;
  image: string;
}

export const aiProjects: AIProject[] = [
  {
    slug: "rag-document-qa",
    title: "RAG Document Q&A",
    summary: "Ask questions across your documents and get cited answers.",
    problem:
      "Teams lose time searching long PDFs and internal documents for specific answers.",
    solution:
      "A retrieval-augmented pipeline that indexes documents and answers questions with grounded responses and source citations.",
    steps: [
      { title: "Ingest", description: "Upload PDFs and docs; extract and clean text." },
      {
        title: "Chunk & Embed",
        description: "Split into semantic chunks and embed them.",
      },
      {
        title: "Store",
        description: "Persist vectors in a vector database with metadata.",
      },
      {
        title: "Retrieve",
        description: "Run similarity search and rerank top passages.",
      },
      {
        title: "Generate",
        description: "Prompt the LLM with context and return cited answers.",
      },
    ],
    tech: ["Python", "FastAPI", "LangChain", "Vector DB", "OpenAI API", "Next.js"],
    githubUrl: "https://github.com/your-username/rag-document-qa",
    demoUrl: "https://example.com/rag-document-qa",
    image: "/images/ai/rag-document-qa.jpg",
  },
  {
    slug: "ai-chatbot",
    title: "AI Chatbot",
    summary: "A context-aware conversational assistant with memory and tools.",
    problem: "Static FAQs and rule-based bots fail on open-ended questions.",
    solution:
      "A streaming chatbot with conversation memory, retrieval over a knowledge base and tool calling for live actions.",
    steps: [
      { title: "Receive", description: "Accept user messages over a streaming API." },
      {
        title: "Contextualise",
        description: "Load conversation history and relevant knowledge.",
      },
      {
        title: "Reason",
        description: "Let the LLM decide between answering and calling tools.",
      },
      { title: "Respond", description: "Stream tokens back to the client in real time." },
      { title: "Persist", description: "Store the exchange for memory and analytics." },
    ],
    tech: ["Python", "FastAPI", "LangChain", "PostgreSQL", "WebSockets", "React"],
    githubUrl: "https://github.com/your-username/ai-chatbot",
    demoUrl: "https://example.com/ai-chatbot",
    image: "/images/ai/ai-chatbot.jpg",
  },
  {
    slug: "ai-lead-scraper",
    title: "AI Lead Scraper",
    summary: "Automated pipeline that finds, enriches and scores business leads.",
    problem: "Manual prospect research is slow, repetitive and inconsistent.",
    solution:
      "A scraping and enrichment workflow where an LLM extracts structured company data and scores relevance against defined criteria.",
    steps: [
      {
        title: "Discover",
        description: "Collect candidate pages from search and directories.",
      },
      {
        title: "Scrape",
        description: "Fetch and clean page content respecting robots rules.",
      },
      {
        title: "Extract",
        description: "Use an LLM to pull structured fields into a schema.",
      },
      { title: "Score", description: "Rank leads against configurable criteria." },
      { title: "Export", description: "Deliver results to CSV or a CRM via API." },
    ],
    tech: ["Python", "Playwright", "LangChain", "Pydantic", "PostgreSQL"],
    githubUrl: "https://github.com/your-username/ai-lead-scraper",
    image: "/images/ai/ai-lead-scraper.jpg",
  },
];
