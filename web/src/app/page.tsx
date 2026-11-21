import { Hero } from "@/components/hero/hero";
import { About } from "@/components/sections/about";
import { SectionPlaceholder } from "@/components/sections/section-placeholder";
import { SECTIONS } from "@/data/navigation";

/** Sections that already have a real component; the rest are still placeholders. */
const BUILT = new Set(["home", "about"]);

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <About />
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
