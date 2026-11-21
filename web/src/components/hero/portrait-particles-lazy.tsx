"use client";

import dynamic from "next/dynamic";
import { PortraitSkeleton } from "./portrait-skeleton";

/**
 * Client-only, code-split: keeps Three.js out of the initial bundle and off the server.
 * While the chunk loads, the silhouette shimmer holds the space (same box, no layout shift).
 */
export const PortraitParticlesLazy = dynamic(
  () => import("./portrait-particles").then((m) => m.PortraitParticles),
  { ssr: false, loading: () => <PortraitSkeleton /> },
);
