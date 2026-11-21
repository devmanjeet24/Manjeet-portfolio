/**
 * REPLACE WITH REAL DATA
 * Placeholder AI projects: pitches, pipeline steps, links and code snippets are fictional.
 * Each project's `steps` drive the "How it works" diagram; `code` is the FastAPI snippet.
 */

export type AIProjectStatus = "Live" | "In progress" | "Prototype";

/** Icon shown on a pipeline box (mapped in components/sections/ai-pipeline.tsx). */
export type PipelineIcon =
  | "upload"
  | "scissors"
  | "binary"
  | "database"
  | "search"
  | "cpu"
  | "message"
  | "history"
  | "send"
  | "save"
  | "globe"
  | "download"
  | "file-text"
  | "gauge";

export interface ArchitectureStep {
  /** Short, shown in the diagram box. */
  title: string;
  /** One sentence, shown when the step is highlighted. */
  description: string;
  icon: PipelineIcon;
}

export interface AIProject {
  slug: string;
  title: string;
  /** One-line pitch under the title. */
  summary: string;
  status: AIProjectStatus;
  problem: string;
  solution: string;
  /** Ordered pipeline shown as the "How it works" diagram. */
  steps: ArchitectureStep[];
  tech: string[];
  githubUrl?: string;
  demoUrl?: string;
  /** Link to the FastAPI /docs page (hidden when missing). */
  apiDocsUrl?: string;
  /** "Backend: FastAPI" snippet. */
  code: { filename: string; snippet: string };
}

export const aiProjects: AIProject[] = [
  {
    slug: "rag-document-qa",
    title: "RAG Document Q&A",
    summary: "Ask questions across your documents and get answers that cite the page.",
    status: "Live",
    problem:
      "Teams lose time searching long PDFs and internal documents for one specific answer, and keyword search misses pages that use different words.",
    solution:
      "Documents are split into passages and indexed by meaning. A question finds the closest passages, and the answer is written from those passages only, with the file and page attached.",
    steps: [
      {
        title: "Upload",
        description: "Add PDFs or docs from the browser.",
        icon: "upload",
      },
      {
        title: "Chunking",
        description:
          "Split the text into short passages, on headings and paragraphs first.",
        icon: "scissors",
      },
      {
        title: "Embeddings",
        description: "Turn each passage into a vector that captures its meaning.",
        icon: "binary",
      },
      {
        title: "Vector DB",
        description:
          "Store the vectors in PostgreSQL with pgvector, next to the page number.",
        icon: "database",
      },
      {
        title: "Retrieval",
        description: "Find the passages closest in meaning to the question.",
        icon: "search",
      },
      {
        title: "LLM",
        description: "Ask the model to answer using only those passages.",
        icon: "cpu",
      },
      {
        title: "Answer",
        description: "Return the answer together with the file and page it came from.",
        icon: "message",
      },
    ],
    tech: [
      "Python",
      "FastAPI",
      "LangChain",
      "PostgreSQL",
      "pgvector",
      "OpenAI API",
      "Next.js",
    ],
    githubUrl: "https://github.com/your-username/rag-document-qa",
    demoUrl: "https://example.com/rag-document-qa",
    apiDocsUrl: "https://api.example.com/rag/docs",
    code: {
      filename: "app/routes/ask.py",
      snippet: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Docs Q&A")


class Question(BaseModel):
    text: str
    top_k: int = 4


@app.post("/ask")
async def ask(q: Question):
    # 1. find the passages closest to the question
    passages = await vector_store.search(q.text, k=q.top_k)

    # 2. answer using only those passages
    answer = await llm.answer(q.text, context=passages)

    return {
        "answer": answer,
        "sources": [p.source for p in passages],
    }`,
    },
  },
  {
    slug: "ai-chatbot",
    title: "AI Chatbot",
    summary:
      "A chat assistant that remembers the conversation and answers from a knowledge base.",
    status: "Live",
    problem:
      "Static FAQs and rule-based bots fail on open-ended questions, and forget what was said a minute ago.",
    solution:
      "A streaming chatbot that keeps the conversation, looks things up in a knowledge base when needed, and can call tools for live actions.",
    steps: [
      {
        title: "Message",
        description: "The user's message arrives over a WebSocket.",
        icon: "message",
      },
      {
        title: "Context",
        description: "Load the recent conversation for this session.",
        icon: "history",
      },
      {
        title: "Lookup",
        description: "Search the knowledge base for anything relevant to the question.",
        icon: "search",
      },
      {
        title: "Reason",
        description: "The model decides: answer directly, or call a tool first.",
        icon: "cpu",
      },
      {
        title: "Stream",
        description: "Send the reply back token by token as it is written.",
        icon: "send",
      },
      {
        title: "Remember",
        description: "Save the exchange so the next message has context.",
        icon: "save",
      },
    ],
    tech: [
      "Python",
      "FastAPI",
      "LangChain",
      "PostgreSQL",
      "WebSockets",
      "Claude API",
      "React",
    ],
    githubUrl: "https://github.com/your-username/ai-chatbot",
    demoUrl: "https://example.com/ai-chatbot",
    apiDocsUrl: "https://api.example.com/chat/docs",
    code: {
      filename: "app/routes/chat.py",
      snippet: `from fastapi import FastAPI, WebSocket

app = FastAPI(title="Chat")


@app.websocket("/chat/{session_id}")
async def chat(ws: WebSocket, session_id: str):
    await ws.accept()
    history = await memory.load(session_id)

    while True:
        message = await ws.receive_text()

        # stream the reply as it is generated
        async for token in llm.stream(history, message):
            await ws.send_text(token)

        await memory.save(session_id, message)`,
    },
  },
  {
    slug: "ai-lead-scraper",
    title: "AI Lead Scraper",
    summary:
      "Finds, reads and ranks business leads so the research is done before the first call.",
    status: "In progress",
    problem:
      "Manual prospect research is slow, repetitive and inconsistent from one person to the next.",
    solution:
      "A background job collects pages, pulls the useful facts into a fixed format, and scores each lead against criteria you set.",
    steps: [
      {
        title: "Discover",
        description: "Collect candidate pages from search results and directories.",
        icon: "globe",
      },
      {
        title: "Scrape",
        description: "Fetch each page and clean it up, respecting robots rules.",
        icon: "download",
      },
      {
        title: "Extract",
        description: "Pull company name, size and contact details into a fixed schema.",
        icon: "file-text",
      },
      {
        title: "Score",
        description: "Rank every lead against the criteria you defined.",
        icon: "gauge",
      },
      {
        title: "Export",
        description: "Send the ranked list to a CSV or a CRM through its API.",
        icon: "send",
      },
    ],
    tech: ["Python", "FastAPI", "Playwright", "LangChain", "Pydantic", "PostgreSQL"],
    githubUrl: "https://github.com/your-username/ai-lead-scraper",
    code: {
      filename: "app/routes/leads.py",
      snippet: `from fastapi import BackgroundTasks, FastAPI
from pydantic import BaseModel

app = FastAPI(title="Lead Scraper")


class ScrapeJob(BaseModel):
    query: str
    max_pages: int = 50


@app.post("/leads/run", status_code=202)
async def run(job: ScrapeJob, tasks: BackgroundTasks):
    run_id = await store.create_run(job)

    # scraping takes minutes: do it after responding
    tasks.add_task(scrape_and_score, run_id, job)

    return {"run_id": run_id, "status": "queued"}`,
    },
  },
];
