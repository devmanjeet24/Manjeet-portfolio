import { Container } from "@/components/ui/container";
import { MaskedHeading } from "@/components/ui/masked-heading";
import { SectionLabel } from "@/components/ui/section-label";
import { experience } from "@/data/experience";
import { EducationRow } from "./education-row";
import { ExperienceTimeline } from "./experience-timeline";

export function Experience() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="border-border relative overflow-hidden border-t py-24 md:py-36"
    >
      <Container size="wide" className="space-y-16 md:space-y-24">
        <div className="space-y-6">
          <SectionLabel index="06">Experience</SectionLabel>
          <MaskedHeading
            id="experience-heading"
            before="The path so"
            italic="far"
            className="text-5xl md:text-7xl lg:text-8xl"
          />
          <p className="text-muted max-w-xl text-base leading-relaxed md:text-lg">
            Jobs, internships, client work and projects I took on myself, newest first.
          </p>
        </div>

        <ExperienceTimeline items={experience} />

        <EducationRow />
      </Container>
    </section>
  );
}
