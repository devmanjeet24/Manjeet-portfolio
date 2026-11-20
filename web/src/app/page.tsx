import { Hero } from "@/components/hero/hero";
import { SectionPlaceholder } from "@/components/sections/section-placeholder";
import { SECTIONS } from "@/data/navigation";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      {SECTIONS.map(({ id, label }, i) =>
        id === "home" ? null : (
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
