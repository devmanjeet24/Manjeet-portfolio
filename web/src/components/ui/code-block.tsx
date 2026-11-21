"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import { highlightPython } from "@/lib/highlight-python";
import { cn } from "@/lib/cn";

interface CodeBlockProps {
  code: string;
  filename: string;
  /** Small tag in the header, e.g. "FastAPI". */
  label?: string;
  className?: string;
}

/** Syntax-highlighted code panel with a copy button. Always dark, in both themes. */
export function CodeBlock({ code, filename, label, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    if (!(await copyToClipboard(code))) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e] text-[#e7e2d9]",
        className,
      )}
    >
      <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-3 font-mono text-[11px] tracking-[0.14em] uppercase">
          <span aria-hidden className="flex gap-1.5">
            <span className="size-2 rounded-full bg-white/20" />
            <span className="size-2 rounded-full bg-white/20" />
            <span className="size-2 rounded-full bg-white/20" />
          </span>
          <span className="truncate text-white/60 normal-case">{filename}</span>
          {label ? <span className="text-accent hidden sm:inline">{label}</span> : null}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-white/70 uppercase transition-colors hover:border-white/40 hover:text-white"
        >
          {copied ? (
            <Check aria-hidden className="size-3.5 text-emerald-400" />
          ) : (
            <Copy aria-hidden className="size-3.5" />
          )}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed md:text-[13px]">
        <code>{highlightPython(code)}</code>
      </pre>
    </figure>
  );
}
