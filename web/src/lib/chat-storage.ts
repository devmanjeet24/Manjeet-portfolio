import { STORED_MESSAGES } from "./chat-config";
import type { ChatMessage } from "./chat-types";

const SESSION_KEY = "portfolio-chat:session";
const MESSAGES_KEY = "portfolio-chat:messages";
const PING_KEY = "portfolio-chat:ping";

/** Short random id. `crypto.randomUUID` is missing on plain-http origins, so there is a fallback. */
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** The anonymous conversation id (8-64 letters, digits, - or _, as the API requires). */
export function getSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;
    const created = uid();
    window.localStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    // Storage blocked: a per-page id still works, it just does not survive a reload.
    return uid();
  }
}

function isMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    (v.role === "user" || v.role === "assistant") &&
    typeof v.content === "string"
  );
}

export function loadMessages(): ChatMessage[] {
  try {
    const raw = window.sessionStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMessage).map((m) =>
      // A reply that was still arriving when the page closed is shown as stopped.
      m.status === "pending" || m.status === "streaming" ? { ...m, status: "stopped" as const } : m,
    );
  } catch {
    return [];
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  try {
    const kept = messages.slice(-STORED_MESSAGES);
    if (kept.length === 0) window.sessionStorage.removeItem(MESSAGES_KEY);
    else window.sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(kept));
  } catch {
    // Storage full or blocked: the chat just does not persist.
  }
}

/** When the API was last pinged (ms since epoch), to avoid waking it again and again. */
export function lastPing(): number {
  try {
    return Number(window.sessionStorage.getItem(PING_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function rememberPing(): void {
  try {
    window.sessionStorage.setItem(PING_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}
