"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/layout/smooth-scroll-provider";
import type { Project } from "@/data/projects";
import { cn } from "@/lib/cn";
import { mockVariantFor, ProjectMock, type MockVariant } from "./project-mock";

type Item =
  | { kind: "image"; src: string; alt: string }
  | { kind: "mock"; variant: MockVariant; seedKey: string; alt: string };

const MOCK_VARIANTS: readonly MockVariant[] = [
  "dashboard",
  "storefront",
  "workspace",
  "feed",
  "chat",
  "generic",
];

/** Real screenshots when set; otherwise three different generated mocks. */
function buildItems(project: Project): Item[] {
  if (project.gallery?.length) {
    return project.gallery.map((src, i) => ({
      kind: "image",
      src,
      alt: `${project.title}: screenshot ${i + 1}`,
    }));
  }
  const own = mockVariantFor(project);
  const others = MOCK_VARIANTS.filter((v) => v !== own).slice(0, 2);
  return [own, ...others].map((variant, i) => ({
    kind: "mock",
    variant,
    seedKey: `-gallery-${i}`,
    alt: `${project.title}: placeholder screen ${i + 1}`,
  }));
}

function Picture({
  item,
  project,
  className,
}: {
  item: Item;
  project: Project;
  className?: string;
}) {
  if (item.kind === "image") {
    return (
      <div className={cn("relative aspect-[16/10]", className)}>
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes="(min-width: 1024px) 1100px, 100vw"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <ProjectMock
      project={project}
      variant={item.variant}
      seedKey={item.seedKey}
      className={className}
    />
  );
}

export function ProjectGallery({ project }: { project: Project }) {
  const items = buildItems(project);
  const [open, setOpen] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { stop, start } = useSmoothScroll();

  const close = useCallback(() => {
    setOpen(null);
    triggerRef.current?.focus();
  }, []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setOpen((i) => (i === null ? i : (i + dir + items.length) % items.length)),
    [items.length],
  );

  // While the lightbox is open: lock page scroll, listen for keys, keep focus inside.
  useEffect(() => {
    if (open === null) return;
    stop();
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = previous;
      start();
    };
  }, [open, close, step, stop, start]);

  const current = open === null ? null : items[open];

  return (
    <>
      <ul className="grid gap-4 md:grid-cols-2 md:gap-6">
        {items.map((item, i) => (
          <li key={i} className={cn(i === 0 && "md:col-span-2")}>
            <button
              type="button"
              data-cursor="view"
              data-cursor-label="Open"
              aria-label={`Open image ${i + 1} of ${items.length}`}
              onClick={(e) => {
                triggerRef.current = e.currentTarget;
                setOpen(i);
              }}
              className="group border-border block w-full overflow-hidden rounded-2xl border"
            >
              <span className="block transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                <Picture
                  item={item}
                  project={project}
                  className={i === 0 ? "aspect-[16/9]" : undefined}
                />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {current && open !== null ? (
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${project.title} images`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md md:p-10"
          >
            <motion.div
              key={open}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10"
            >
              <Picture item={current} project={project} />
            </motion.div>

            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.22em] text-white/70 uppercase">
              {open + 1} / {items.length}
            </p>
            {[
              {
                label: "Close",
                onClick: close,
                pos: "top-4 right-4 md:top-6 md:right-6",
                icon: <X className="size-5" aria-hidden />,
                ref: closeRef,
              },
              {
                label: "Previous image",
                onClick: () => step(-1),
                pos: "left-3 top-1/2 -translate-y-1/2 md:left-6",
                icon: <ChevronLeft className="size-6" aria-hidden />,
              },
              {
                label: "Next image",
                onClick: () => step(1),
                pos: "right-3 top-1/2 -translate-y-1/2 md:right-6",
                icon: <ChevronRight className="size-6" aria-hidden />,
              },
            ].map(({ label, onClick, pos, icon, ref }) => (
              <button
                key={label}
                ref={ref}
                type="button"
                aria-label={label}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className={cn(
                  "absolute inline-flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition-colors hover:bg-white hover:text-black",
                  pos,
                )}
              >
                {icon}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
