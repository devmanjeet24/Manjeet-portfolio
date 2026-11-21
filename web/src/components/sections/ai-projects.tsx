"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { MaskedHeading } from "@/components/ui/masked-heading";
import { SectionLabel } from "@/components/ui/section-label";
import { aiProjects } from "@/data/aiProjects";
import { openChat } from "@/lib/chat-events";
import { AiProjectCard } from "./ai-project-card";

/** "Try the assistant" line. Opens the chat widget; says so if the widget is not there yet. */
function ChatPrompt() {
  const [unavailable, setUnavailable] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const open = () => {
    if (openChat()) return;
    // The assistant widget is not built yet: tell the visitor instead of doing nothing.
    setUnavailable(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setUnavailable(false), 3500);
  };

  return (
    <div className="border-border border-t pt-10 md:pt-14">
      <button
        type="button"
        onClick={open}
        className="group font-display hover:text-accent text-left text-3xl tracking-tight transition-colors md:text-5xl"
      >
        Try the AI assistant on this site{" "}
        <span
          aria-hidden
          className="text-accent inline-block transition-transform duration-500 group-hover:translate-x-2"
        >
          &rarr;
        </span>
      </button>
      <p
        role="status"
        aria-live="polite"
        className="text-muted mt-4 min-h-5 font-mono text-[11px] tracking-[0.14em] uppercase"
      >
        {unavailable ? "The assistant is not available yet. Check back soon." : ""}
      </p>
    </div>
  );
}

export function AiProjects() {
  return (
    <section
      id="ai"
      aria-labelledby="ai-heading"
      className="border-border relative isolate overflow-hidden border-t py-24 md:py-36"
    >
      {/* Subtle grid and glow behind everything */}
      <div aria-hidden className="ai-grid pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="bg-accent/10 pointer-events-none absolute -top-40 left-1/2 -z-10 h-[460px] w-[900px] -translate-x-1/2 rounded-full blur-[130px]"
      />

      <Container size="wide" className="space-y-12 md:space-y-16">
        <div className="space-y-6">
          <SectionLabel index="05">AI Projects</SectionLabel>
          <MaskedHeading
            id="ai-heading"
            before="Under the"
            italic="hood"
            className="text-5xl md:text-7xl lg:text-8xl"
          />
          <p className="text-muted max-w-xl text-base leading-relaxed md:text-lg">
            Three projects built around language models, and how each one is put together.
          </p>
        </div>

        <ul className="space-y-8 md:space-y-12">
          {aiProjects.map((project, i) => (
            <li key={project.slug}>
              <FadeIn>
                <AiProjectCard project={project} number={i + 1} />
              </FadeIn>
            </li>
          ))}
        </ul>

        <ChatPrompt />
      </Container>
    </section>
  );
}
