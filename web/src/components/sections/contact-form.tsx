"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { contactSchema, type ContactValues } from "@/lib/contact-schema";
import { FloatingInput, FloatingTextarea } from "./floating-field";
import { SuccessMark } from "./success-mark";

type Status = "idle" | "sending" | "sent" | "error";

const EASE = [0.22, 1, 0.36, 1] as const;
const MESSAGE_MAX = 2000;

/** What the visitor sees for each failure the API can report. */
function messageFor(
  status: number,
  code: string | undefined,
  retryAfter: number | undefined,
  email: string,
) {
  if (status === 429) {
    const minutes = Math.max(1, Math.ceil((retryAfter ?? 600) / 60));
    return `That is a lot of messages from one connection. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  }
  if (code === "not_configured") {
    return `The contact form is not switched on yet. Please email me directly at ${email}.`;
  }
  return `Something went wrong and the message was not sent. You can try again, or email me at ${email}.`;
}

function SuccessPanel({
  name,
  email,
  onReset,
}: {
  name: string;
  email: string;
  onReset: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  // Move focus to the confirmation so keyboard and screen-reader users land on it.
  useEffect(() => heading.current?.focus(), []);

  return (
    <div className="border-accent/30 bg-surface-glass flex min-h-[28rem] flex-col items-start justify-center gap-6 rounded-3xl border p-8 backdrop-blur-md md:p-12">
      <SuccessMark className="size-20" />
      <h3
        ref={heading}
        tabIndex={-1}
        className="font-display text-4xl tracking-tight outline-none md:text-5xl"
      >
        Message sent
      </h3>
      <p className="text-muted max-w-md text-lg leading-relaxed">
        Thanks{name ? `, ${name.split(" ")[0]}` : ""}. I will reply to {email} as soon as
        I can.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="text-muted hover:text-accent font-mono text-[11px] tracking-[0.14em] uppercase underline-offset-4 transition-colors hover:underline"
      >
        Send another message
      </button>
    </div>
  );
}

/** The contact form: floating labels, inline validation, loading / success / error states. */
export function ContactForm({ ownerEmail }: { ownerEmail: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [problem, setProblem] = useState("");
  const [sent, setSent] = useState({ name: "", email: "" });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched", // check a field when you leave it, then on every change
    defaultValues: { name: "", email: "", subject: "", message: "", website: "" },
  });

  const messageLength = (useWatch({ control, name: "message" }) ?? "").length;

  const onSubmit = async (values: ContactValues) => {
    setStatus("sending");
    setProblem("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });
      const data: {
        ok?: boolean;
        error?: string;
        retryAfter?: number;
        fieldErrors?: Record<string, string>;
      } | null = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setSent({ name: values.name, email: values.email });
        setStatus("sent");
        reset();
        return;
      }
      if (res.status === 400 && data?.fieldErrors) {
        // The server disagreed with the browser: show its messages on the fields.
        for (const [field, message] of Object.entries(data.fieldErrors)) {
          if (field in values)
            setError(field as keyof ContactValues, { message }, { shouldFocus: true });
        }
        setStatus("idle");
        return;
      }
      setProblem(messageFor(res.status, data?.error, data?.retryAfter, ownerEmail));
      setStatus("error");
    } catch {
      setProblem(
        `Could not reach the server. Check your connection and try again, or email me at ${ownerEmail}.`,
      );
      setStatus("error");
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const sending = status === "sending";

  return (
    <div>
      {/* Spoken status for screen readers (errors have their own alert below) */}
      <p role="status" aria-live="polite" className="sr-only">
        {sending
          ? "Sending your message."
          : status === "sent"
            ? "Your message was sent."
            : ""}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {status === "sent" ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <SuccessPanel
              name={sent.name}
              email={sent.email}
              onReset={() => {
                setStatus("idle");
              }}
            />
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative space-y-4"
            aria-label="Contact form"
          >
            <FloatingInput
              id="contact-name"
              label="Name"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <FloatingInput
              id="contact-email"
              type="email"
              inputMode="email"
              label="Email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <FloatingInput
              id="contact-subject"
              label="Subject"
              optional
              error={errors.subject?.message}
              {...register("subject")}
            />
            <FloatingTextarea
              id="contact-message"
              label="Message"
              rows={6}
              count={messageLength}
              maxCount={MESSAGE_MAX}
              error={errors.message?.message}
              {...register("message")}
            />

            {/* Honeypot: invisible and unreachable for people; bots tend to fill every field. */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Leave this field empty
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register("website")}
                />
              </label>
            </div>

            {status === "error" ? (
              <p
                role="alert"
                className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm leading-relaxed text-red-700 dark:text-red-300"
              >
                {problem}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={sending}
              arrow={sending ? undefined : "right"}
            >
              {sending ? (
                <>
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Sending
                </>
              ) : (
                "Send message"
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
