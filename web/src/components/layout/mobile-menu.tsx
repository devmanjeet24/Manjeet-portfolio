"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useEffect, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { NAV_LINKS } from "@/data/navigation";
import { cn } from "@/lib/cn";

interface MobileMenuProps {
  open: boolean;
  activeId: string | null;
  onClose: () => void;
  onAnchorClick: (
    event: MouseEvent<HTMLElement>,
    id: string,
    options?: { delay?: number },
  ) => void;
}

/** Wait for the scroll lock to release before scrolling. */
const SCROLL_DELAY = 120;

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function MobileMenu({ open, activeId, onClose, onAnchorClick }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-background/95 fixed inset-0 z-40 flex flex-col justify-center px-8 backdrop-blur-2xl"
        >
          <SectionLabel className="mb-8">Navigation</SectionLabel>
          <motion.ul
            variants={list}
            initial="hidden"
            animate="show"
            className="space-y-1"
          >
            {NAV_LINKS.map(({ id, label }) => (
              <motion.li key={id} variants={item}>
                <Link
                  href={`/#${id}`}
                  onClick={(e) => {
                    onAnchorClick(e, id, { delay: SCROLL_DELAY });
                    onClose();
                  }}
                  aria-current={activeId === id ? "location" : undefined}
                  className={cn(
                    "font-display block text-6xl leading-[1.1] tracking-tight transition-colors",
                    activeId === id ? "text-accent italic" : "text-foreground",
                  )}
                >
                  {label}
                </Link>
              </motion.li>
            ))}
          </motion.ul>
          <motion.div variants={item} initial="hidden" animate="show" className="mt-12">
            <Button
              href="/#contact"
              arrow="right"
              size="lg"
              onClick={(e) => {
                onAnchorClick(e, "contact", { delay: SCROLL_DELAY });
                onClose();
              }}
            >
              Let&apos;s talk
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
