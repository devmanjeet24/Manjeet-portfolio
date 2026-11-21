"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, ExternalLink, X } from "lucide-react";
import { useRef } from "react";
import { useModal } from "@/hooks/use-modal";
import { profile } from "@/data/profile";

interface ResumeViewerProps {
  open: boolean;
  onClose: () => void;
}

/** The PDF in a modal. Browsers without an inline PDF viewer get a link instead (see Resume). */
export function ResumeViewer({ open, onClose }: ResumeViewerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModal({ open, onClose, containerRef: dialogRef, initialFocusRef: closeRef });

  const tools =
    "inline-flex h-9 items-center gap-2 rounded-full border border-white/15 px-4 font-mono text-[10px] tracking-[0.14em] text-white/80 uppercase transition-colors hover:border-white/40 hover:text-white";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Resume"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md md:p-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#161618]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <p className="font-mono text-[11px] tracking-[0.22em] text-white/70 uppercase">
                Resume
              </p>
              <div className="flex items-center gap-2">
                <a href={profile.resumeUrl} download className={tools}>
                  <Download aria-hidden className="size-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <a
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={tools}
                >
                  <ExternalLink aria-hidden className="size-3.5" />
                  <span className="hidden sm:inline">New tab</span>
                </a>
                <button
                  ref={closeRef}
                  type="button"
                  aria-label="Close resume"
                  onClick={onClose}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:bg-white hover:text-black"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </div>
            </div>

            <object
              data={`${profile.resumeUrl}#view=FitH`}
              type="application/pdf"
              aria-label="Resume (PDF)"
              // Keep Tab out of the PDF viewer: keys pressed inside it never reach this page, so
              // Escape could not close the dialog. Keyboard users have the "New tab" link.
              tabIndex={-1}
              className="min-h-0 w-full flex-1 bg-white"
            >
              <p className="p-6 text-sm text-white/80">
                Your browser cannot show PDFs here.{" "}
                <a
                  className="text-accent underline"
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open the resume in a new tab
                </a>
                .
              </p>
            </object>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
