"use client";

import { Check } from "lucide-react";
import { useCallback, useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { MaskedHeading } from "@/components/ui/masked-heading";
import { SectionLabel } from "@/components/ui/section-label";
import { profile } from "@/data/profile";
import { trackEvent } from "@/lib/analytics";
import { DownloadResumeButton } from "./download-resume-button";
import { ResumePreview } from "./resume-preview";
import { ResumeViewer } from "./resume-viewer";

export function Resume() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const view = (event?: MouseEvent<HTMLElement>) => {
    event?.preventDefault();
    trackEvent("resume_view", { source: "resume" });
    // No built-in PDF viewer (many phones): open the file in its own tab instead of a modal.
    if (typeof navigator !== "undefined" && navigator.pdfViewerEnabled === false) {
      window.open(profile.resumeUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setOpen(true);
  };

  return (
    <section
      id="resume"
      aria-labelledby="resume-heading"
      className="border-border relative overflow-hidden border-t py-24 md:py-36"
    >
      <Container size="wide" className="space-y-14 md:space-y-20">
        <div className="space-y-6">
          <SectionLabel index="07">Resume</SectionLabel>
          <MaskedHeading
            id="resume-heading"
            before="The short"
            italic="version"
            className="text-5xl md:text-7xl lg:text-8xl"
          />
          <p className="text-muted max-w-xl text-base leading-relaxed md:text-lg">
            Everything above, on one page.
          </p>
        </div>

        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
          <FadeIn className="flex flex-col items-center gap-5 lg:col-span-5">
            <ResumePreview onOpen={() => view()} />
            <p className="text-muted font-mono text-[10px] tracking-[0.22em] uppercase">
              Preview &middot; click to open
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="space-y-10 lg:col-span-7">
            <ul aria-label="Highlights" className="space-y-5">
              {profile.resumeHighlights.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-4 text-lg leading-relaxed md:text-xl"
                >
                  <span
                    aria-hidden
                    className="bg-accent/15 text-accent mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4">
              <DownloadResumeButton magnetic source="resume" />
              <Button variant="secondary" size="lg" arrow="right" onClick={view}>
                View online
              </Button>
            </div>
            <p className="text-muted font-mono text-[10px] tracking-[0.22em] uppercase">
              PDF &middot; opens in this page or a new tab
            </p>
          </FadeIn>
        </div>
      </Container>

      <ResumeViewer open={open} onClose={close} />
    </section>
  );
}
