/**
 * Where the chat assistant (the FastAPI service in /api) lives.
 *
 * NEXT_PUBLIC_API_URL must be set in production (Vercel). In development it falls back to
 * the local API so `npm run dev` works with `uvicorn app.main:app` out of the box.
 */
const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ?? "";

export const CHAT_API_URL =
  configured || (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

/** False until NEXT_PUBLIC_API_URL is set: the widget then explains instead of failing. */
export const CHAT_CONFIGURED = CHAT_API_URL !== "";

/** Optional shared key (CHAT_API_KEY on the API). It is public in the bundle: a filter, not a secret. */
export const CHAT_API_KEY = process.env.NEXT_PUBLIC_CHAT_API_KEY?.trim() ?? "";

/** Must match the API (`MAX_MESSAGE_CHARS`). */
export const MAX_MESSAGE_CHARS = 500;

/** How many earlier messages are sent along for follow-up questions. */
export const HISTORY_MESSAGES = 12;

/** Messages kept in sessionStorage. */
export const STORED_MESSAGES = 40;

/** Render's free tier can need up to a minute to wake up. */
export const COLD_FIRST_BYTE_MS = 75_000;
export const WARM_FIRST_BYTE_MS = 30_000;
/** Show "Waking up the assistant…" when nothing has arrived after this long. */
export const WAKING_NOTICE_MS = 3_500;

export const WELCOME_QUESTIONS = [
  "What projects has he built?",
  "What's his tech stack?",
  "Experience with AI/RAG?",
  "How can I contact him?",
] as const;
