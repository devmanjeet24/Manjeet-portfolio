import Image from "next/image";
import { profile } from "@/data/profile";
import { PORTRAIT } from "@/lib/portrait-config";

/**
 * Styled image frame: on devices that can hover, the photo starts as a warm duotone with a
 * halftone dot screen and returns to full colour on hover. Touch devices always show colour.
 */
export function AboutPortrait() {
  return (
    <figure className="group border-border bg-surface relative aspect-[5/4] overflow-hidden rounded-2xl border">
      {/* Soft accent glow behind the figure */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_70%_at_55%_30%,var(--accent-glow),transparent_70%)]"
      />
      <Image
        src={PORTRAIT.src}
        alt={`Portrait of ${profile.name}`}
        fill
        sizes="(min-width: 1024px) 520px, 100vw"
        className="origin-bottom -translate-x-[8%] scale-[1.06] object-contain object-bottom transition-[filter,transform] duration-700 [@media(hover:hover)]:contrast-125 [@media(hover:hover)]:grayscale [@media(hover:hover)]:group-hover:scale-[1.12] [@media(hover:hover)]:group-hover:contrast-100 [@media(hover:hover)]:group-hover:grayscale-0"
      />
      {/* Duotone tint + halftone screen: fade away on hover (hover-capable devices only) */}
      <div
        aria-hidden
        className="bg-accent pointer-events-none absolute inset-0 hidden opacity-25 mix-blend-multiply transition-opacity duration-700 group-hover:opacity-0 [@media(hover:hover)]:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden [background-image:radial-gradient(circle,rgb(0_0_0/0.85)_0.8px,transparent_1.3px)] [background-size:5px_5px] opacity-25 mix-blend-multiply transition-opacity duration-700 group-hover:opacity-0 dark:opacity-40 [@media(hover:hover)]:block"
      />
      <figcaption className="text-foreground/70 absolute bottom-3 left-4 font-mono text-[10px] tracking-[0.22em] uppercase">
        <span className="text-accent">Fig. 01</span>
        <span className="hidden [@media(hover:hover)]:inline"> / hover for colour</span>
      </figcaption>
    </figure>
  );
}
