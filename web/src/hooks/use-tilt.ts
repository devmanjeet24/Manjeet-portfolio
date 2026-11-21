"use client";

import { useSpring, type MotionValue } from "framer-motion";
import { useCallback, type PointerEvent } from "react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

interface Tilt {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  /** Attach to the element that should react to the pointer. */
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: () => void;
}

/**
 * Pointer-following 3D tilt as spring MotionValues (apply as `style={{ rotateX, rotateY }}`).
 * Touch pointers and reduced motion never tilt.
 */
export function useTilt(maxDegrees = 6): Tilt {
  const reduceMotion = usePrefersReducedMotion();
  const rotateX = useSpring(0, { stiffness: 180, damping: 20, mass: 0.6 });
  const rotateY = useSpring(0, { stiffness: 180, damping: 20, mass: 0.6 });

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (reduceMotion || event.pointerType === "touch") return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      rotateY.set(x * 2 * maxDegrees);
      rotateX.set(-y * 2 * maxDegrees);
    },
    [reduceMotion, rotateX, rotateY, maxDegrees],
  );

  const onPointerLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return { rotateX, rotateY, onPointerMove, onPointerLeave };
}
