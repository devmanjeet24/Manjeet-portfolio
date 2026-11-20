import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionLabel } from "@/components/ui/section-label";

interface SectionPlaceholderProps {
  id: string;
  index: string;
  label: string;
  heading?: "h1" | "h2";
}

/** Temporary empty section so navigation can be tested. */
export function SectionPlaceholder({
  id,
  index,
  label,
  heading = "h2",
}: SectionPlaceholderProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="border-border flex min-h-screen items-center border-t first:border-t-0"
    >
      <Container className="space-y-6 py-24">
        <SectionLabel index={index}>{label}</SectionLabel>
        <SectionHeading
          id={`${id}-heading`}
          as={heading}
          size={heading === "h1" ? "xl" : "lg"}
          italic={label}
        />
      </Container>
    </section>
  );
}
