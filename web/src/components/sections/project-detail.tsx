import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { MaskedHeading } from "@/components/ui/masked-heading";
import { ImageReveal, PageEnter } from "@/components/ui/page-enter";
import { SectionLabel } from "@/components/ui/section-label";
import type { Project } from "@/data/projects";
import { BackButton } from "./back-button";
import { ProjectGallery } from "./project-gallery";
import { ProjectMock } from "./project-mock";

/** One content block: a label column on the left, the text on the right. */
function Block({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <FadeIn>
      <section className="border-border grid gap-6 border-t py-12 md:grid-cols-12 md:gap-10 md:py-16">
        <div className="space-y-3 md:col-span-4">
          <SectionLabel index={index}>{title}</SectionLabel>
          <h2 className="font-display text-3xl tracking-tight md:text-4xl">{title}</h2>
        </div>
        <div className="md:col-span-8">{children}</div>
      </section>
    </FadeIn>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <dt className="text-muted font-mono text-[10px] tracking-[0.22em] uppercase">
        {label}
      </dt>
      <dd className="text-sm md:text-base">{children}</dd>
    </div>
  );
}

interface ProjectDetailProps {
  project: Project;
  next: Project | undefined;
}

/** The whole /projects/[slug] page. Server-rendered; motion and the lightbox are small client islands. */
export function ProjectDetail({ project, next }: ProjectDetailProps) {
  const words = project.title.trim().split(/\s+/);
  const last = words.pop() ?? project.title;

  return (
    <PageEnter>
      <article>
        {/* Header */}
        <Container size="wide" className="space-y-10 pt-28 md:space-y-14 md:pt-36">
          <BackButton />

          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="space-y-6 lg:col-span-8">
              <SectionLabel>
                Project{project.mern ? " / MERN stack" : ""} / {project.category}
              </SectionLabel>
              <MaskedHeading
                as="h1"
                id="project-title"
                before={words.join(" ")}
                italic={last}
                className="text-5xl md:text-7xl lg:text-8xl"
              />
              <p className="text-muted max-w-2xl text-lg leading-relaxed md:text-xl">
                {project.shortDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:col-span-4 lg:justify-end">
              {project.liveUrl ? (
                <Button
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  arrow="up-right"
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
                  size="lg"
                  arrow="up-right"
                >
                  GitHub
                </Button>
              ) : null}
            </div>
          </div>

          <dl className="border-border grid grid-cols-2 gap-6 border-t pt-8 md:grid-cols-4">
            <Fact label="Year">{project.year}</Fact>
            <Fact label="Role">{project.role}</Fact>
            <Fact label="Type">{project.category}</Fact>
            <Fact label="Stack">
              {project.mern ? (
                <Badge variant="accent" title="MongoDB, Express, React and Node.js">
                  MERN
                </Badge>
              ) : (
                "Custom stack"
              )}
            </Fact>
          </dl>

          <div className="space-y-3">
            <p className="text-muted font-mono text-[10px] tracking-[0.22em] uppercase">
              Tech stack
            </p>
            <ul aria-label="Tech stack" className="flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <li key={t}>
                  <Badge>{t}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </Container>

        {/* Full-width hero image */}
        <ImageReveal className="relative mt-12 w-full overflow-hidden md:mt-16">
          {project.image ? (
            <div className="relative aspect-[16/10] w-full md:aspect-[21/9]">
              <Image
                src={project.image}
                alt={`Screenshot of ${project.title}`}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <ProjectMock project={project} className="aspect-[16/10] md:aspect-[21/9]" />
          )}
          <div
            aria-hidden
            className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t to-transparent"
          />
        </ImageReveal>

        {/* Content */}
        <Container size="wide" className="mt-8 md:mt-12">
          <Block index="01" title="Overview">
            <p className="text-lg leading-relaxed md:text-xl">
              {project.longDescription}
            </p>
          </Block>

          <Block index="02" title="The problem">
            <p className="text-muted text-lg leading-relaxed md:text-xl">
              {project.problem}
            </p>
          </Block>

          <Block index="03" title="My approach">
            <p className="text-muted text-lg leading-relaxed md:text-xl">
              {project.approach}
            </p>
          </Block>

          <Block index="04" title="Key features">
            <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {project.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 leading-relaxed">
                  <span
                    aria-hidden
                    className="bg-accent/15 text-accent mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </Block>

          <Block index="05" title="Challenges & learnings">
            <ol className="space-y-8">
              {project.challenges.map((c, i) => (
                <li key={c.title} className="grid gap-2 sm:grid-cols-[2rem_1fr] sm:gap-4">
                  <span className="text-accent font-mono text-[11px] tracking-[0.22em]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-display text-2xl tracking-tight">{c.title}</h3>
                    <p className="text-muted leading-relaxed">{c.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Block>

          <Block index="06" title="Gallery">
            <p className="text-muted mb-6 text-sm">Click an image to enlarge it.</p>
            <ProjectGallery project={project} />
          </Block>
        </Container>

        {/* Next project */}
        {next && next.slug !== project.slug ? (
          <FadeIn>
            <Link
              href={`/projects/${next.slug}`}
              data-cursor="view"
              data-cursor-label="Next"
              className="group border-border hover:bg-surface-glass mt-10 block border-t py-16 transition-colors md:mt-16 md:py-24"
            >
              <Container size="wide" className="grid items-center gap-10 lg:grid-cols-12">
                <div className="space-y-5 lg:col-span-7">
                  <p className="text-muted font-mono text-[11px] tracking-[0.22em] uppercase">
                    Next project
                  </p>
                  <p className="font-display text-5xl leading-[1.02] tracking-tight md:text-7xl">
                    {next.title}
                    <span
                      aria-hidden
                      className="text-accent ml-4 inline-block transition-transform duration-500 group-hover:translate-x-3"
                    >
                      &rarr;
                    </span>
                  </p>
                  <p className="text-muted max-w-md">{next.shortDescription}</p>
                </div>
                <div className="border-border overflow-hidden rounded-2xl border lg:col-span-5">
                  <div className="transition-transform duration-700 ease-out group-hover:scale-[1.05]">
                    {next.image ? (
                      <div className="relative aspect-[16/10]">
                        <Image
                          src={next.image}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 500px, 100vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <ProjectMock project={next} />
                    )}
                  </div>
                </div>
              </Container>
            </Link>
          </FadeIn>
        ) : null}
      </article>
    </PageEnter>
  );
}
