/** Maps a knowledge-base file (as the API reports it) to a label and the section it describes. */
const SOURCES: Record<string, { label: string; sectionId?: string }> = {
  "about.md": { label: "About", sectionId: "about" },
  "skills.md": { label: "Skills", sectionId: "skills" },
  "projects.md": { label: "Projects", sectionId: "projects" },
  "ai-projects.md": { label: "AI Projects", sectionId: "ai" },
  "experience.md": { label: "Experience", sectionId: "experience" },
  "education.md": { label: "Education", sectionId: "experience" },
  "faq.md": { label: "FAQ" },
};

export interface SourceChip {
  key: string;
  label: string;
  sectionId?: string;
}

/** Unique, readable chips for a list of source files. Unknown files get a tidied-up name. */
export function toSourceChips(sources: readonly string[]): SourceChip[] {
  const seen = new Set<string>();
  const chips: SourceChip[] = [];
  for (const source of sources) {
    const file = source.split("/").pop() ?? source;
    const known = SOURCES[file];
    const label =
      known?.label ??
      file
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[-_]+/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase());
    if (seen.has(label)) continue;
    seen.add(label);
    chips.push({ key: file, label, sectionId: known?.sectionId });
  }
  return chips;
}
