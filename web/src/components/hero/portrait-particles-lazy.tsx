"use client";

import dynamic from "next/dynamic";

/** Client-only, code-split: keeps Three.js out of the initial bundle and off the server. */
export const PortraitParticlesLazy = dynamic(
  () => import("./portrait-particles").then((m) => m.PortraitParticles),
  { ssr: false, loading: () => <div aria-hidden className="size-full" /> },
);
