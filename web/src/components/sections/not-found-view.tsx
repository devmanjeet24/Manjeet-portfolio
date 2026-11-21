import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";

interface NotFoundViewProps {
  label: string;
  before: string;
  italic: string;
  body: string;
}

/** Shared 404 layout (used for unknown pages and unknown projects). */
export function NotFoundView({ label, before, italic, body }: NotFoundViewProps) {
  return (
    <main id="main" className="flex min-h-[80vh] items-center pt-28 pb-20">
      <Container size="wide" className="space-y-8">
        <SectionLabel index="404">{label}</SectionLabel>
        <h1 className="font-display max-w-3xl text-5xl leading-[1.02] tracking-tight text-balance md:text-7xl">
          {before} <em className="text-accent italic">{italic}</em>
        </h1>
        <p className="text-muted max-w-lg text-lg leading-relaxed">{body}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button href="/#projects" size="lg" arrow="right">
            See all projects
          </Button>
          <Button href="/" variant="secondary" size="lg">
            Home
          </Button>
        </div>
      </Container>
    </main>
  );
}
