import type { Metadata } from "next";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Badge,
  Button,
  Card,
  Container,
  SectionHeading,
  SectionLabel,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Design test",
  robots: { index: false, follow: false },
};

const COLORS = [
  ["background", "bg-background"],
  ["surface", "bg-surface"],
  ["border", "bg-border-strong"],
  ["foreground", "bg-foreground"],
  ["muted", "bg-muted"],
  ["accent", "bg-accent"],
] as const;

export default function DesignTestPage() {
  return (
    <main id="main" className="py-16 md:py-24">
      <Container className="space-y-20">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-6">
            <SectionLabel index="00">Design system / temporary</SectionLabel>
            <SectionHeading as="h1" size="xl" before="Crafted with" italic="restraint" />
          </div>
          <ThemeToggle />
        </header>

        <section className="space-y-6" aria-labelledby="t-colors">
          <SectionLabel index="01" id="t-colors">
            Colors
          </SectionLabel>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
            {COLORS.map(([name, cls]) => (
              <div key={name} className="space-y-2">
                <div className={`${cls} border-border h-20 rounded-xl border`} />
                <p className="text-muted font-mono text-[11px] uppercase">{name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6" aria-labelledby="t-type">
          <SectionLabel index="02" id="t-type">
            Typography
          </SectionLabel>
          <SectionHeading before="Selected" italic="work" after="and experiments" />
          <p className="text-muted max-w-xl text-lg leading-relaxed">
            Body copy in Inter — comfortable, neutral and highly legible. Paired with an
            editorial serif for display and a mono face for small, letter-spaced labels.
          </p>
          <p className="font-mono text-xs tracking-[0.22em] uppercase">
            Scroll to discover
          </p>
        </section>

        <section className="space-y-6" aria-labelledby="t-buttons">
          <SectionLabel index="03" id="t-buttons">
            Buttons
          </SectionLabel>
          <div className="flex flex-wrap items-center gap-4">
            <Button>Primary</Button>
            <Button arrow="right">Let&apos;s talk</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="secondary" arrow="up-right">
              View project
            </Button>
            <Button variant="ghost" arrow="right">
              Ghost
            </Button>
            <Button size="lg" arrow="right">
              Start a conversation
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <section className="space-y-6" aria-labelledby="t-badges">
          <SectionLabel index="04" id="t-badges">
            Badges
          </SectionLabel>
          <div className="flex flex-wrap gap-2">
            {["Next.js", "TypeScript", "FastAPI", "LangChain", "PostgreSQL"].map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
            <Badge variant="accent">RAG</Badge>
          </div>
        </section>

        <section className="space-y-6" aria-labelledby="t-cards">
          <SectionLabel index="05" id="t-cards">
            Cards
          </SectionLabel>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <SectionLabel>Static</SectionLabel>
              <h3 className="font-display mt-3 text-3xl">Subtle glass surface</h3>
              <p className="text-muted mt-2 text-sm leading-relaxed">
                Thin border, blurred translucent fill.
              </p>
            </Card>
            <Card interactive tabIndex={0}>
              <SectionLabel>Interactive — hover me</SectionLabel>
              <h3 className="font-display mt-3 text-3xl">
                Glow on <em className="italic">hover</em>
              </h3>
              <p className="text-muted mt-2 text-sm leading-relaxed">
                Border warms to the accent and a soft glow appears.
              </p>
            </Card>
          </div>
        </section>
      </Container>
    </main>
  );
}
