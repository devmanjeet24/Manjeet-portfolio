"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { MotionValue } from "framer-motion";

interface ProgressDebugProps {
  /** The progress MotionValue the portrait listens to. */
  progress: MotionValue<number>;
  /** Called with true while the slider owns progress, false when scroll takes over. */
  onOwnChange: (own: boolean) => void;
  /** Returns control to scroll (re-applies the current scroll position). */
  onRelease: () => void;
}

interface Stats {
  progress: string;
  frameMs: string;
  renderMs: string;
}

const noopSubscribe = () => () => {};
// Dev only, and only with ?debug=1. Read from the URL directly: no Suspense needed.
const isEnabled = () =>
  process.env.NODE_ENV !== "production" &&
  new URLSearchParams(window.location.search).get("debug") === "1";

/** Dev-only scrubber for the portrait disintegration. Renders nothing in production. */
export function ProgressDebug({ progress, onOwnChange, onRelease }: ProgressDebugProps) {
  const enabled = useSyncExternalStore(noopSubscribe, isEnabled, () => false);
  const [value, setValue] = useState(0);
  const [own, setOwn] = useState(false);
  const [stats, setStats] = useState<Stats>({
    progress: "-",
    frameMs: "-",
    renderMs: "-",
  });

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      const el = document.querySelector<HTMLElement>("#home [data-ready]");
      if (!el) return;
      setStats({
        progress: el.dataset.progress ?? "0",
        frameMs: el.dataset.frameMs ?? "-",
        renderMs: el.dataset.renderMs ?? "-",
      });
    }, 400);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="border-border bg-background/80 fixed right-4 bottom-4 z-[80] w-64 space-y-3 rounded-2xl border p-4 font-mono text-[11px] backdrop-blur-xl">
      <div className="flex items-center justify-between tracking-[0.14em] uppercase">
        <span className="text-accent">Debug / progress</span>
        <span>{value.toFixed(3)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={value}
        aria-label="Disintegration progress"
        onChange={(e) => {
          const v = Number(e.target.value);
          setValue(v);
          setOwn(true);
          onOwnChange(true);
          progress.set(v);
        }}
        className="accent-accent w-full"
      />
      <button
        type="button"
        disabled={!own}
        onClick={() => {
          setOwn(false);
          onOwnChange(false);
          onRelease();
        }}
        className="border-border-strong hover:border-accent w-full rounded-full border px-3 py-2 tracking-[0.14em] uppercase disabled:opacity-40"
      >
        {own ? "Release to scroll" : "Following scroll"}
      </button>
      <dl className="text-muted grid grid-cols-2 gap-x-3 gap-y-1">
        <dt>smoothed</dt>
        <dd className="text-foreground text-right">{stats.progress}</dd>
        <dt>frame ms</dt>
        <dd className="text-foreground text-right">{stats.frameMs}</dd>
        <dt>render ms (cpu)</dt>
        <dd className="text-foreground text-right">{stats.renderMs}</dd>
      </dl>
    </div>
  );
}
