import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact-schema";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 10_000;
const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };
const DEFAULT_RESEND_URL = "https://api.resend.com/emails";

/** JSON response that is never cached. `error` is a short code the form turns into a message. */
function respond(
  status: number,
  body: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
  );
}

/**
 * POST /api/contact
 *  - same-origin only, JSON only, small bodies only
 *  - rate limited: 5 requests per 10 minutes per IP
 *  - validated with the same zod schema as the form
 *  - honeypot: bots that fill the hidden field get a fake "ok" and nothing is sent
 *  - emails the site owner through Resend. The API key stays on the server.
 */
export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("[contact] RESEND_API_KEY or CONTACT_TO_EMAIL is not set");
    return respond(503, { ok: false, error: "not_configured" });
  }

  // Only our own pages may post here.
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host")) {
        return respond(403, { ok: false, error: "forbidden" });
      }
    } catch {
      return respond(403, { ok: false, error: "forbidden" });
    }
  }

  const limited = checkRateLimit(clientIp(request), RATE_LIMIT);
  if (!limited.allowed) {
    return respond(
      429,
      { ok: false, error: "rate_limited", retryAfter: limited.retryAfterSeconds },
      { "Retry-After": String(limited.retryAfterSeconds) },
    );
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return respond(415, { ok: false, error: "unsupported_media_type" });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return respond(413, { ok: false, error: "too_large" });

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return respond(400, { ok: false, error: "invalid_json" });
  }

  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      fieldErrors[field] ??= issue.message;
    }
    return respond(400, { ok: false, error: "validation", fieldErrors });
  }

  const { name, email, subject, message, website } = parsed.data;

  // Honeypot filled: pretend it worked so the bot learns nothing, and send nothing.
  if (website) return respond(200, { ok: true });

  const from =
    process.env.CONTACT_FROM_EMAIL ?? "Portfolio contact <onboarding@resend.dev>";
  const title = subject || "New message";

  try {
    const res = await fetch(process.env.RESEND_API_URL ?? DEFAULT_RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[Portfolio] ${title} (from ${name})`,
        text: `From: ${name} <${email}>\nSubject: ${title}\n\n${message}\n`,
        html: `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p><p><strong>${escapeHtml(title)}</strong></p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      // Log the status only: never the key, and not the visitor's message.
      console.error(`[contact] Resend answered with status ${res.status}`);
      return respond(502, { ok: false, error: "send_failed" });
    }
    return respond(200, { ok: true });
  } catch (error) {
    console.error(
      "[contact] could not reach Resend:",
      error instanceof Error ? error.name : "unknown",
    );
    return respond(502, { ok: false, error: "send_failed" });
  }
}
