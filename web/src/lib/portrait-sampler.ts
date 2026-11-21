/**
 * Turns a transparent portrait image into particle data.
 * Pure browser helper: no Three.js here, only typed arrays.
 */
import { DISINTEGRATE } from "./portrait-config";

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
  /** When each particle starts leaving (0..delaySpan): silhouette edges first, face last. */
  delay: Float32Array;
  /** Face centre in `origin` units; scattering particles drift away from it. */
  focus: [number, number];
  /** Distance between neighbouring samples, in the same units as `origin`. */
  spacing: number;
  /** Time spent decoding and sampling the image (ms). */
  sampleMs: number;
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

/** Alpha at or above this counts as solid when measuring distance to the silhouette. */
const SOLID_ALPHA = 128;

/** Distance (px) from each solid pixel to the nearest non-solid one; 2-pass chamfer. */
function edgeDistance(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const INF = 1e9;
  const d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = data[i * 4 + 3] >= SOLID_ALPHA ? INF : 0;
  const A = 1;
  const B = Math.SQRT2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = d[i];
      if (v === 0) continue;
      if (x > 0) v = Math.min(v, d[i - 1] + A);
      if (y > 0) {
        v = Math.min(v, d[i - w] + A);
        if (x > 0) v = Math.min(v, d[i - w - 1] + B);
        if (x < w - 1) v = Math.min(v, d[i - w + 1] + B);
      }
      d[i] = v;
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let v = d[i];
      if (v === 0) continue;
      if (x < w - 1) v = Math.min(v, d[i + 1] + A);
      if (y < h - 1) {
        v = Math.min(v, d[i + w] + A);
        if (x < w - 1) v = Math.min(v, d[i + w + 1] + B);
        if (x > 0) v = Math.min(v, d[i + w - 1] + B);
      }
      d[i] = v;
    }
  }
  return d;
}

/**
 * Face centre estimate: the middle of the deepest part of the silhouette in the
 * top of the figure (the head), as pixel coordinates.
 */
function findFocus(dist: Float32Array, data: Uint8ClampedArray, w: number, h: number) {
  let minY = h;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] >= SOLID_ALPHA) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxY <= minY) return { x: w / 2, y: h / 2 };

  const limitY = minY + (maxY - minY) * 0.55;
  let best = 0;
  for (let y = minY; y <= limitY; y++) {
    for (let x = 0; x < w; x++) best = Math.max(best, Math.min(dist[y * w + x], 1e6));
  }
  let sx = 0;
  let sy = 0;
  let count = 0;
  for (let y = minY; y <= limitY; y++) {
    for (let x = 0; x < w; x++) {
      if (dist[y * w + x] >= best * 0.8 && dist[y * w + x] < 1e6) {
        sx += x;
        sy += y;
        count++;
      }
    }
  }
  return count ? { x: sx / count, y: sy / count } : { x: w / 2, y: h / 2 };
}

const smooth01 = (v: number) => Math.min(1, Math.max(0, v));

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
  const t0 = performance.now();
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

  const dist = edgeDistance(data, w, h);
  const focusPx = findFocus(dist, data, w, h);
  const edgeScale = DISINTEGRATE.edgeDepth * h;

  const maxCells = (Math.ceil(w / step) + 1) * (Math.ceil(h / step) + 1);
  const origin = new Float32Array(maxCells * 3);
  const color = new Float32Array(maxCells * 3);
  const alphaOut = new Float32Array(maxCells);
  const size = new Float32Array(maxCells);
  const random = new Float32Array(maxCells * 4);
  const edgeOut = new Float32Array(maxCells);
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
      edgeOut[n] = smooth01(Math.min(dist[py * w + px], 1e6) / edgeScale);
      size[n] = 0.9 + 0.2 * luma;
      random[n * 4] = rand();
      random[n * 4 + 1] = rand();
      random[n * 4 + 2] = rand();
      random[n * 4 + 3] = rand();
      n++;
    }
  }

  // Start times: silhouette edges leave first, the face centre last, with a soft
  // top-left to bottom-right sweep and a little randomness so it crumbles organically.
  const aspect = w / h;
  const focus: [number, number] = [
    (focusPx.x + 0.5 - w / 2) / h,
    -(focusPx.y + 0.5 - h / 2) / h,
  ];
  let maxFaceDist = 1e-6;
  const faceDist = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const dx = origin[i * 3] - focus[0];
    const dy = origin[i * 3 + 1] - focus[1];
    faceDist[i] = Math.hypot(dx, dy);
    if (faceDist[i] > maxFaceDist) maxFaceDist = faceDist[i];
  }
  const { weights, delaySpan } = DISINTEGRATE;
  const delay = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const nearFace = 1 - faceDist[i] / maxFaceDist;
    const sweep = 0.5 * (origin[i * 3] / aspect + 0.5) + 0.5 * (0.5 - origin[i * 3 + 1]);
    const late =
      weights.face * nearFace +
      weights.edge * edgeOut[i] +
      weights.sweep * smooth01(sweep) +
      weights.random * random[i * 4];
    delay[i] = smooth01(late) * delaySpan;
  }

  // Shuffle so any prefix of the buffers is a uniform sample of the portrait. That lets the
  // fps guard draw fewer particles (setDrawRange) without cutting off a part of the face.
  const order = new Uint32Array(n);
  for (let i = 0; i < n; i++) order[i] = i;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  const shuffled = (src: Float32Array, stride: number) => {
    const out = new Float32Array(n * stride);
    for (let i = 0; i < n; i++) {
      const from = order[i] * stride;
      for (let k = 0; k < stride; k++) out[i * stride + k] = src[from + k];
    }
    return out;
  };

  return {
    count: n,
    aspect,
    origin: shuffled(origin, 3),
    color: shuffled(color, 3),
    alpha: shuffled(alphaOut, 1),
    size: shuffled(size, 1),
    random: shuffled(random, 4),
    delay: shuffled(delay, 1),
    focus,
    spacing: step / h,
    sampleMs: performance.now() - t0,
  };
}
