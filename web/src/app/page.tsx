import { Hero } from "@/components/hero/hero";
import { About } from "@/components/sections/about";
import { AiProjects } from "@/components/sections/ai-projects";
import { Projects } from "@/components/sections/projects";
import { Skills } from "@/components/sections/skills";
import { SectionPlaceholder } from "@/components/sections/section-placeholder";
import { SECTIONS } from "@/data/navigation";

/** Sections that already have a real component; the rest are still placeholders. */
const BUILT = new Set(["home", "about", "skills", "projects", "ai"]);

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <About />
      <Skills />
      <Projects />
      <AiProjects />
      {SECTIONS.map(({ id, label }, i) =>
        BUILT.has(id) ? null : (
          <SectionPlaceholder
            key={id}
            id={id}
            index={String(i + 1).padStart(2, "0")}
            label={label}
          />
        ),
      )}
    </main>
  );
}
