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

/** Look and behaviour of the particle renderer. */
export const PORTRAIT_LOOK = {
  /**
   * Dark theme adds a second, additive-blended pass that makes scattered particles glow.
   * The assembled portrait always uses normal blending: additive on densely overlapping
   * dots turns the photo grainy (overlap counts vary per pixel).
   */
  darkGlow: true,
  /** Strength of the glow pass (0-1). */
  glow: 0.55,
  /** How much of the photo's own colour survives in the warm off-white dark theme (0-1). */
  photoTint: 0.12,
  /** Smoothing time constant (s) when the theme switches. */
  themeTau: 0.3,
  /** Progress at or above this means every particle is invisible: rendering is skipped. */
  blankAt: 0.9995,
} as const;

/** Frame-rate guard: if average fps stays under `minFps`, quality steps down. */
export const FPS_GUARD = {
  minFps: 40,
  /** Length of the measuring window. */
  windowMs: 2000,
  /** Ignore the first moments after start (shader compile, first uploads). */
  warmupMs: 1500,
  /** Minimum consecutive rendered frames in a window before acting. */
  minSamples: 20,
  /** Share of particles drawn at each quality step. */
  fractions: [1, 0.8, 0.62, 0.48, 0.36],
  /** Resolution is lowered first, in these steps, down to `minDpr`. */
  dprStep: 0.25,
  minDpr: 1,
} as const;
