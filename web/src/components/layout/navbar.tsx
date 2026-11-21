"use client";

import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, SECTIONS } from "@/data/navigation";
import { profile } from "@/data/profile";
import { useActiveSection } from "@/hooks/use-active-section";
import { useAnchorNavigation } from "@/hooks/use-anchor-navigation";
import { useNavbarScroll } from "@/hooks/use-navbar-scroll";
import { cn } from "@/lib/cn";
import { MobileMenu } from "./mobile-menu";
import { useSmoothScroll } from "./smooth-scroll-provider";
import { ThemeSwitch } from "./theme-switch";

const SECTION_IDS = SECTIONS.map((s) => s.id);
const initials = profile.name
  .split(" ")
  .map((part) => part[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

export function Navbar() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrolled, hidden } = useNavbarScroll();
  const { stop, start } = useSmoothScroll();
  const onAnchorClick = useAnchorNavigation();

  const sectionId = useActiveSection(SECTION_IDS, onHome);
  const activeId = SECTIONS.find((s) => s.id === sectionId)?.navId ?? null;

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    stop();
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
      start();
    };
  }, [menuOpen, stop, start]);

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden && !menuOpen ? -120 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      >
        <nav
          aria-label="Primary"
          className={cn(
            "border-border bg-background/60 pointer-events-auto flex items-center gap-1 rounded-full border backdrop-blur-xl transition-all duration-500",
            scrolled ? "p-1 shadow-lg shadow-black/10" : "p-1.5",
          )}
        >
          <Link
            href="/#home"
            onClick={(e) => onAnchorClick(e, "home")}
            aria-label="Home"
            className="font-display text-foreground px-3 text-xl md:hidden"
          >
            {initials}
          </Link>

          <ul className="hidden items-center md:flex">
            {NAV_LINKS.map(({ id, label }) => {
              const active = activeId === id;
              return (
                <li key={id}>
                  <Link
                    href={`/#${id}`}
                    onClick={(e) => onAnchorClick(e, id)}
                    aria-current={active ? "location" : undefined}
                    className={cn(
                      "relative block rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors",
                      active ? "text-foreground" : "text-muted hover:text-foreground",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="bg-foreground/[0.08] absolute inset-0 rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 34 }}
                      />
                    ) : null}
                    <span className="relative">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <ThemeSwitch />

          <Button
            href="/#contact"
            arrow="right"
            magnetic
            onClick={(e) => onAnchorClick(e, "contact")}
            className={cn("ml-3 hidden md:inline-flex", scrolled ? "h-9" : "h-10")}
          >
            Let&apos;s talk
          </Button>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="text-foreground inline-flex size-9 items-center justify-center rounded-full md:hidden"
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </nav>
      </motion.header>

      <MobileMenu
        open={menuOpen}
        activeId={activeId}
        onClose={closeMenu}
        onAnchorClick={onAnchorClick}
      />
    </>
  );
}
