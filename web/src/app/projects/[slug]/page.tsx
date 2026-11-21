import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/sections/project-detail";
import { getNextProject, getProject, projects } from "@/data/projects";
import { profile } from "@/data/profile";

/** Every known project is built at deploy time. */
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata(
  props: PageProps<"/projects/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found" };

  const title = `${project.title} | ${profile.name}`;
  const description = project.shortDescription;
  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/projects/${project.slug}`,
      ...(project.image ? { images: [{ url: project.image, alt: project.title }] } : {}),
    },
    twitter: {
      card: project.image ? "summary_large_image" : "summary",
      title,
      description,
      ...(project.image ? { images: [project.image] } : {}),
    },
  };
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) notFound();

  // Structured data for search engines (our own data, with "<" escaped).
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.shortDescription,
    dateCreated: String(project.year),
    keywords: project.tech.join(", "),
    author: { "@type": "Person", name: profile.name },
  }).replace(/</g, "\\u003c");

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ProjectDetail project={project} next={getNextProject(slug)} />
    </main>
  );
}
