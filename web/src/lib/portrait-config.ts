/**
 * Single place to update when the portrait photo changes.
 * `aspect` = width / height of public/images/portrait.png (after prepare-portrait.py).
 */
export const PORTRAIT = {
  src: "/images/portrait.png",
  aspect: 960 / 825,
  /** Where the face centre sits across the image (0 = left edge, 1 = right edge). */
  faceX: 0.58,
} as const;

/** Hero: the portrait fades out toward the shoulders so the name and text stay readable. */
export const PORTRAIT_FADE_BOTTOM = [0.12, -0.3] as const;

/** Tuning for the scroll-driven disintegration (see lib/portrait-sampler.ts and portrait-shaders.ts). */
export const DISINTEGRATE = {
  /** Share of the 0..1 scroll range over which particle start times are spread. */
  delaySpan: 0.55,
  /** How a particle's start time is chosen. Weights add up to 1. */
  weights: { face: 0.5, edge: 0.3, sweep: 0.1, random: 0.1 },
  /** Distance from the silhouette (as a fraction of image height) that still counts as "edge". */
  edgeDepth: 0.12,
  /** Damping time constant in seconds for the smoothed progress (~0.08 per frame at 60 fps). */
  tau: 0.18,
  /** How far scattering particles shift toward the accent colour (0-1). */
  accentMix: 0.55,
} as const;
