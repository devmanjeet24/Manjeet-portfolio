export interface ChatReference {
  source: string;
  heading: string;
}

export type ChatErrorKind =
  | "offline"
  | "network"
  | "timeout"
  | "rate_limited"
  | "forbidden"
  | "invalid"
  | "unavailable"
  | "not_configured";

export interface ChatErrorInfo {
  kind: ChatErrorKind;
  message: string;
}

export type MessageStatus = "pending" | "streaming" | "done" | "stopped" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Assistant messages only. */
  status?: MessageStatus;
  references?: ChatReference[];
  suggestions?: string[];
  error?: ChatErrorInfo;
}

/** What the API sends over Server-Sent Events. */
export type ChatStreamEvent =
  | { type: "sources"; sources: string[]; references: ChatReference[] }
  | { type: "token"; text: string }
  | {
      type: "done";
      sources: string[];
      references: ChatReference[];
      grounded: boolean;
      suggestions: string[];
    }
  | { type: "error"; code: string; message: string };
