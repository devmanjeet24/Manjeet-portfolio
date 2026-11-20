"use client";

import { useReducedMotion } from "framer-motion";
import { useFinePointer } from "@/hooks/use-fine-pointer";
import { CURSOR_TRAIL_ENABLED } from "@/lib/cursor-config";
import { CursorSpotlight } from "./cursor-spotlight";
import { CursorTrail } from "./cursor-trail";
import { CustomCursor } from "./custom-cursor";

/** Mounts cursor, spotlight and (optional) trail only on fine-pointer devices. */
export function CursorSystem() {
  const fine = useFinePointer();
  const reduce = useReducedMotion() ?? false;

  if (!fine) return null;

  return (
    <>
      <CursorSpotlight reduceMotion={reduce} />
      <CustomCursor reduceMotion={reduce} />
      {CURSOR_TRAIL_ENABLED && !reduce ? <CursorTrail /> : null}
    </>
  );
}
