import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import type { AIProject, AIProjectStatus } from "@/data/aiProjects";
import { cn } from "@/lib/cn";
import { AiPipeline } from "./ai-pipeline";

const STATUS: Record<
  AIProjectStatus,
  { dot: string; ping: string; text: string; pulse: boolean }
> = {
  Live: {
    dot: "bg-emerald-500",
    ping: "bg-emerald-400/70",
    text: "text-emerald-400",
    pulse: true,
  },
  "In progress": {
    dot: "bg-amber-400",
    ping: "bg-amber-300/70",
    text: "text-amber-400",
    pulse: true,
  },
  Prototype: { dot: "bg-muted", ping: "bg-muted/50", text: "text-muted", pulse: false },
};

function StatusBadge({ status }: { status: AIProjectStatus }) {
  const s = STATUS[status];
  return (
    <span
      className={cn(
        "border-border inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.14em] uppercase",
        s.text,
      )}
    >
      <span aria-hidden className="relative flex size-2">
        {s.pulse ? (
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full",
              s.ping,
            )}
          />
        ) : null}
        <span className={cn("relative inline-flex size-2 rounded-full", s.dot)} />
      </span>
      {status}
    </span>
  );
}

function SmallLabel({ children }: { children: string }) {
  return (
    <p className="text-accent font-mono text-[11px] tracking-[0.22em] uppercase">
      {children}
    </p>
  );
}

export function AiProjectCard({
  project,
  number,
}: {
  project: AIProject;
  number: number;
}) {
  const label = `AI-${String(number).padStart(2, "0")}`;

  return (
    <article className="border-accent/30 bg-surface-glass relative overflow-hidden rounded-3xl border p-6 shadow-[0_0_60px_-30px_var(--accent-glow)] backdrop-blur-md md:p-10">
      {/* glowing top edge and corner light */}
      <span
        aria-hidden
        className="via-accent absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
      />
      <span
        aria-hidden
        className="bg-accent/10 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl"
      />

      <div className="relative space-y-10 md:space-y-14">
        {/* Header */}
        <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-accent font-mono text-[11px] tracking-[0.22em] uppercase">
                [{label}]
              </span>
              <StatusBadge status={project.status} />
            </div>
            <h3 className="font-display text-4xl leading-[1.02] tracking-tight text-balance md:text-6xl">
              {project.title}
            </h3>
            <p className="text-muted max-w-2xl text-lg leading-relaxed">
              {project.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {project.demoUrl ? (
              <Button
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                arrow="up-right"
                aria-label={`${project.title}: live demo`}
              >
                Live Demo
              </Button>
            ) : null}
            {project.githubUrl ? (
              <Button
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                arrow="up-right"
                aria-label={`${project.title}: source on GitHub`}
              >
                GitHub
              </Button>
            ) : null}
            {project.apiDocsUrl ? (
              <Button
                href={project.apiDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                arrow="up-right"
                aria-label={`${project.title}: API documentation`}
              >
                API Docs
              </Button>
            ) : null}
          </div>
        </header>

        {/* How it works */}
        <section aria-label={`How ${project.title} works`} className="space-y-6">
          <SmallLabel>How it works</SmallLabel>
          <AiPipeline steps={project.steps} />
        </section>

        {/* Problem, approach, tech + the FastAPI endpoint */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-8 lg:col-span-5">
            <div className="space-y-3">
              <SmallLabel>The problem</SmallLabel>
              <p className="text-muted leading-relaxed">{project.problem}</p>
            </div>
            <div className="space-y-3">
              <SmallLabel>The approach</SmallLabel>
              <p className="text-muted leading-relaxed">{project.solution}</p>
            </div>
            <div className="space-y-3">
              <SmallLabel>Built with</SmallLabel>
              <ul aria-label="Technologies" className="flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <li key={t}>
                    <Badge>{t}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-7">
            <SmallLabel>Backend: FastAPI</SmallLabel>
            <CodeBlock
              code={project.code.snippet}
              filename={project.code.filename}
              label="FastAPI"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
