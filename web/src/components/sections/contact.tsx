import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { MaskedHeading } from "@/components/ui/masked-heading";
import { SectionLabel } from "@/components/ui/section-label";
import { profile } from "@/data/profile";
import { ContactForm } from "./contact-form";
import { CopyEmail } from "./copy-email";

const LINKS = ["linkedin", "github"] as const;

export function Contact() {
  const links = LINKS.map((icon) => profile.socials.find((s) => s.icon === icon)).filter(
    (s): s is NonNullable<typeof s> => s !== undefined,
  );

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="border-border relative overflow-hidden border-t py-24 md:py-36"
    >
      <div
        aria-hidden
        className="bg-accent/10 pointer-events-none absolute -bottom-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full blur-[140px]"
      />
      <Container size="wide" className="relative space-y-14 md:space-y-20">
        <div className="space-y-6">
          <SectionLabel index="08">Contact</SectionLabel>
          <MaskedHeading
            id="contact-heading"
            before="Let's build something"
            italic="together."
            className="max-w-5xl text-5xl md:text-7xl lg:text-8xl"
          />
        </div>

        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="space-y-10 lg:col-span-5">
            <p className="text-muted max-w-md text-lg leading-relaxed">
              Have a project in mind, a question, or just want to say hello? Write to me
              and I will get back to you.
            </p>

            <div className="space-y-3">
              <p className="text-accent font-mono text-[11px] tracking-[0.22em] uppercase">
                Email
              </p>
              <CopyEmail email={profile.email} />
            </div>

            <ul className="border-border divide-border divide-y border-y">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group hover:text-accent flex items-center justify-between py-4 transition-colors"
                  >
                    <span className="font-display text-2xl tracking-tight">
                      {link.label}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="text-muted group-hover:text-accent size-5 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </a>
                </li>
              ))}
            </ul>

            <p className="text-muted flex items-center gap-3 font-mono text-[11px] tracking-[0.14em] uppercase">
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              {profile.responseTime}
            </p>
          </div>

          <div className="lg:col-span-7">
            <ContactForm ownerEmail={profile.email} />
          </div>
        </div>
      </Container>
    </section>
  );
}
