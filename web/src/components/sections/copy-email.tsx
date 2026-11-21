"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Toast } from "@/components/ui/toast";
import { copyToClipboard } from "@/lib/clipboard";

/** The email address as a big button: click to copy, with a toast. A mailto link sits underneath. */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    if (!(await copyToClipboard(email))) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy email address: ${email}`}
        className="group hover:text-accent flex max-w-full items-center gap-3 text-left transition-colors"
      >
        <span className="font-display text-3xl tracking-tight break-all md:text-4xl">
          {email}
        </span>
        <span
          aria-hidden
          className="border-border group-hover:border-accent inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors"
        >
          {copied ? (
            <Check className="text-accent size-4" />
          ) : (
            <Copy className="size-4" />
          )}
        </span>
      </button>
      <a
        href={`mailto:${email}`}
        className="text-muted hover:text-accent text-sm underline-offset-4 transition-colors hover:underline"
      >
        Or open it in your mail app
      </a>
      <Toast message="Email address copied" show={copied} />
    </div>
  );
}
