"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { profile } from "@/data/profile";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/cn";

interface DownloadResumeButtonProps {
  size?: "md" | "lg";
  variant?: "primary" | "secondary";
  magnetic?: ButtonProps["magnetic"];
  className?: string;
  /** Which part of the site the click came from (sent with the analytics event). */
  source?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * "Download resume": a real download link that also records the click and shows a short
 * success state (the label slides to "Downloaded" and a check draws itself).
 */
export function DownloadResumeButton({
  size = "lg",
  variant = "primary",
  magnetic,
  className,
  source = "resume",
}: DownloadResumeButtonProps) {
  const [done, setDone] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = () => {
    trackEvent("resume_download", { source });
    setDone(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 2600);
  };

  return (
    <>
      <Button
        href={profile.resumeUrl}
        download
        size={size}
        variant={variant}
        magnetic={magnetic}
        onClick={onClick}
        className={cn(
          "min-w-[15rem]",
          done && "bg-emerald-500 text-white hover:bg-emerald-500 hover:text-white",
          className,
        )}
      >
        <span className="relative inline-flex h-5 items-center overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.span
                key="done"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="inline-flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none">
                  <motion.path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.12, ease: EASE }}
                  />
                </svg>
                Downloaded
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="inline-flex items-center gap-2"
              >
                Download resume
                <ArrowDown
                  aria-hidden
                  className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {done ? "Resume downloaded" : ""}
      </span>
    </>
  );
}
