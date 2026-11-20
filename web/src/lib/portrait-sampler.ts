/**
 * Turns a transparent portrait image into particle data.
 * Pure browser helper: no Three.js here, only typed arrays.
 */

export interface PortraitSample {
  count: number;
  /** Image width / height. */
  aspect: number;
  /** xyz per particle, centred; image height is normalised to 1. */
  origin: Float32Array;
  /** rgb (0-1, sRGB) per particle. */
  color: Float32Array;
  /** Opacity (0-1) per particle; feathered edges fade smoothly. */
  alpha: Float32Array;
  /** Relative size per particle (~0.85-1.15). */
  size: Float32Array;
  /** Four random seeds per particle. */
  random: Float32Array;
  /** Distance between neighbouring samples, in the same units as `origin`. */
  spacing: number;
}

export interface SampleOptions {
  /** Desired particle count; the grid step adapts to hit it. */
  targetCount: number;
  /** Pixels with alpha below this (0-255) are skipped. */
  alphaThreshold?: number;
  /** How far a sample may move inside its grid cell (0 = cell centre, 1 = anywhere). */
  jitter?: number;
  /** Pixels darker than this luminance (0-1) are skipped. 0 keeps everything. */
  minLuma?: number;
  /** Z range driven by brightness (image height = 1). */
  depth?: number;
  /** Longest side the image is read at. */
  maxSize?: number;
}

/** Small seeded PRNG so the particle layout is identical on every load. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

export async function samplePortrait(
  src: string,
  {
    targetCount,
    alphaThreshold = 6,
    jitter = 0.3,
    minLuma = 0,
    depth = 0.05,
    maxSize = 1200,
  }: SampleOptions,
): Promise<PortraitSample> {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas is not available");
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  // Pass 1: how many pixels are opaque? That sets the adaptive grid step.
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] >= alphaThreshold) opaque++;
  if (opaque === 0) throw new Error("Portrait has no opaque pixels");
  const step = Math.max(1, Math.sqrt(opaque / targetCount));

  const maxCells = (Math.ceil(w / step) + 1) * (Math.ceil(h / step) + 1);
  const origin = new Float32Array(maxCells * 3);
  const color = new Float32Array(maxCells * 3);
  const alphaOut = new Float32Array(maxCells);
  const size = new Float32Array(maxCells);
  const random = new Float32Array(maxCells * 4);
  const rand = mulberry32(0x9e3779b1);

  // Pass 2: one jittered sample per grid cell (jitter avoids a visible lattice).
  let n = 0;
  for (let cy = 0; cy < h; cy += step) {
    for (let cx = 0; cx < w; cx += step) {
      const px = Math.min(w - 1, Math.floor(cx + (0.5 + (rand() - 0.5) * jitter) * step));
      const py = Math.min(h - 1, Math.floor(cy + (0.5 + (rand() - 0.5) * jitter) * step));
      const idx = (py * w + px) * 4;
      const alpha = data[idx + 3];
      if (alpha < alphaThreshold) continue;

      const r = data[idx] / 255;
      const g = data[idx + 1] / 255;
      const b = data[idx + 2] / 255;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luma < minLuma) continue;

      origin[n * 3] = (px + 0.5 - w / 2) / h;
      origin[n * 3 + 1] = -(py + 0.5 - h / 2) / h;
      origin[n * 3 + 2] = (luma - 0.5) * depth + (rand() - 0.5) * depth * 0.3;
      color[n * 3] = r;
      color[n * 3 + 1] = g;
      color[n * 3 + 2] = b;
      alphaOut[n] = alpha / 255;
      size[n] = 0.9 + 0.2 * luma;
      random[n * 4] = rand();
      random[n * 4 + 1] = rand();
      random[n * 4 + 2] = rand();
      random[n * 4 + 3] = rand();
      n++;
    }
  }

  return {
    count: n,
    aspect: w / h,
    origin: origin.slice(0, n * 3),
    color: color.slice(0, n * 3),
    alpha: alphaOut.slice(0, n),
    size: size.slice(0, n),
    random: random.slice(0, n * 4),
    spacing: step / h,
  };
}
