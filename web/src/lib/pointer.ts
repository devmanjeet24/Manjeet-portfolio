/**
 * One shared window `pointermove` listener for every pointer-driven effect
 * (cursor, spotlight, trail, magnetic buttons, parallax). Subscribers run
 * outside React, so moving the mouse never triggers a re-render.
 */

type PointerListener = (x: number, y: number, event: PointerEvent) => void;

const listeners = new Set<PointerListener>();

function onMove(event: PointerEvent) {
  if (event.pointerType === "touch") return;
  listeners.forEach((listener) => listener(event.clientX, event.clientY, event));
}

export function subscribePointer(listener: PointerListener): () => void {
  if (listeners.size === 0) {
    window.addEventListener("pointermove", onMove, { passive: true });
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("pointermove", onMove);
  };
}
