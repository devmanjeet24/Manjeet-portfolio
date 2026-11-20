import { SectionPlaceholder } from "@/components/sections/section-placeholder";
import { SECTIONS } from "@/data/navigation";

export default function Home() {
  return (
    <main id="main">
      {SECTIONS.map(({ id, label }, i) => (
        <SectionPlaceholder
          key={id}
          id={id}
          index={String(i + 1).padStart(2, "0")}
          label={label}
          heading={id === "home" ? "h1" : "h2"}
        />
      ))}
    </main>
  );
}
