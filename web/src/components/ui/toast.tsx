"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

/** A small message at the bottom of the screen. The live region is always present, so screen readers announce it. */
export function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4"
    >
      <AnimatePresence>
        {show ? (
          <motion.p
            key="toast"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="border-border-strong bg-background/90 flex items-center gap-2 rounded-full border px-5 py-3 font-mono text-[11px] tracking-[0.14em] uppercase shadow-lg shadow-black/20 backdrop-blur-xl"
          >
            <Check aria-hidden className="text-accent size-4" />
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
