import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { certifications, education } from "@/data/education";

/** Compact "Education" row: one card per degree, plus one card for certifications. */
export function EducationRow() {
  return (
    <div className="border-border space-y-6 border-t pt-12 md:pt-16">
      <SectionLabel>Education</SectionLabel>
      <ul className="grid gap-4 md:grid-cols-2">
        {education.map((edu) => (
          <li key={`${edu.institution}-${edu.degree}`}>
            <Card className="h-full space-y-3 p-6">
              <p className="text-accent font-mono text-[11px] tracking-[0.22em] uppercase">
                {edu.period}
              </p>
              <h3 className="font-display text-2xl leading-tight tracking-tight md:text-3xl">
                {edu.degree}
              </h3>
              <p className="text-foreground/90">
                {edu.institution}
                <span className="text-muted"> · {edu.field}</span>
              </p>
              {edu.description ? (
                <p className="text-muted text-sm leading-relaxed">{edu.description}</p>
              ) : null}
            </Card>
          </li>
        ))}
        {certifications.length > 0 ? (
          <li>
            <Card className="h-full space-y-4 p-6">
              <p className="text-accent font-mono text-[11px] tracking-[0.22em] uppercase">
                Certifications
              </p>
              <ul className="space-y-3">
                {certifications.map((c) => (
                  <li
                    key={`${c.title}-${c.year}`}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <span>
                      {c.url ? (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-accent underline-offset-4 transition-colors hover:underline"
                        >
                          {c.title}
                        </a>
                      ) : (
                        c.title
                      )}
                      <span className="text-muted block text-sm">{c.issuer}</span>
                    </span>
                    <span className="text-muted shrink-0 font-mono text-[11px] tracking-[0.14em]">
                      {c.year}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
