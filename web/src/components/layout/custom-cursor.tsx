"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { subscribePointer } from "@/lib/pointer";

type CursorState = "default" | "link" | "button" | "view" | "drag" | "text" | "hidden";

const STATES: readonly CursorState[] = [
  "default",
  "link",
  "button",
  "view",
  "drag",
  "text",
  "hidden",
];

const DEFAULT_LABELS: Partial<Record<CursorState, string>> = {
  view: "View",
  drag: "Drag",
};

const BUTTON_SELECTOR = "button, [role='button'], summary, select, input[type='submit']";
const LINK_SELECTOR = "a[href], [role='link']";
const TEXT_SELECTOR =
  "input:not([type='checkbox']):not([type='radio']):not([type='submit']):not([type='range']), textarea, [contenteditable='true']";

interface Resolved {
  state: CursorState;
  label: string;
}

/** Nearest ancestor wins: an explicit `data-cursor` or an interactive element. */
function resolve(target: EventTarget | null): Resolved {
  let node = target instanceof Element ? target : null;
  while (node) {
    if (node instanceof HTMLElement && node.dataset.cursor) {
      const requested = node.dataset.cursor;
      const state = STATES.find((s) => s === requested) ?? "default";
      return { state, label: node.dataset.cursorLabel ?? DEFAULT_LABELS[state] ?? "" };
    }
    if (node.matches(TEXT_SELECTOR)) return { state: "text", label: "" };
    if (node.matches(BUTTON_SELECTOR)) return { state: "button", label: "" };
    if (node.matches(LINK_SELECTOR)) return { state: "link", label: "" };
    node = node.parentElement;
  }
  return { state: "default", label: "" };
}

/**
 * Dot (instant) + ring (lagging via gsap.quickTo). All updates go through refs
 * and data attributes; styling lives in globals.css, so React never re-renders.
 */
export function CustomCursor({ reduceMotion }: { reduceMotion: boolean }) {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    const html = document.documentElement;
    html.classList.add("cursor-custom");

    const ringX = gsap.quickTo(ring, "x", {
      duration: reduceMotion ? 0.001 : 0.55,
      ease: "power3.out",
    });
    const ringY = gsap.quickTo(ring, "y", {
      duration: reduceMotion ? 0.001 : 0.55,
      ease: "power3.out",
    });

    const layers = [dot, ring];
    let ready = false;
    let current = "";

    const unsubscribe = subscribePointer((x, y) => {
      gsap.set(dot, { x, y });
      if (!ready) {
        ready = true;
        gsap.set(ring, { x, y });
        layers.forEach((l) => (l.dataset.ready = "true"));
      } else {
        ringX(x);
        ringY(y);
      }
      layers.forEach((l) => delete l.dataset.hidden);
    });

    const apply = ({ state, label: text }: Resolved) => {
      const key = `${state}|${text}`;
      if (key === current) return;
      current = key;
      layers.forEach((l) => (l.dataset.state = state));
      label.textContent = text;
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "touch") apply(resolve(e.target));
    };
    const onDown = () => layers.forEach((l) => (l.dataset.pressed = "true"));
    const onUp = () => layers.forEach((l) => delete l.dataset.pressed);
    const onLeave = () => layers.forEach((l) => (l.dataset.hidden = "true"));

    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    html.addEventListener("mouseleave", onLeave);

    return () => {
      unsubscribe();
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      html.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf([dot, ring]);
      html.classList.remove("cursor-custom");
    };
  }, [reduceMotion]);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        data-state="default"
        className="cursor-layer cursor-ring"
      >
        <div className="cursor-ring-inner">
          <span ref={labelRef} className="cursor-label" />
        </div>
      </div>
      <div
        ref={dotRef}
        aria-hidden
        data-state="default"
        className="cursor-layer cursor-dot"
      >
        <div className="cursor-dot-inner" />
      </div>
    </>
  );
}
