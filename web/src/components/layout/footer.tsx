import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { profile } from "@/data/profile";
import { BackToTop } from "./back-to-top";
import { FooterMeta } from "./footer-meta";

export function Footer() {
  return (
    <footer className="border-border mt-auto border-t py-10">
      <Container className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <FooterMeta name={profile.name} />

        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {profile.socials.map(({ label, url }) => (
            <li key={label}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-foreground group inline-flex items-center gap-1 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors"
              >
                {label}
                <ArrowUpRight
                  aria-hidden
                  className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </li>
          ))}
        </ul>

        <BackToTop />
      </Container>
    </footer>
  );
}
