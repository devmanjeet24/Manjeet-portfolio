"use client";

import type { MotionValue } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { useFinePointer } from "@/hooks/use-fine-pointer";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";
import { getDeviceTier, type DeviceTier } from "@/lib/device-tier";
import { subscribePointer } from "@/lib/pointer";
import { DISINTEGRATE, FPS_GUARD, PORTRAIT_LOOK } from "@/lib/portrait-config";
import { samplePortrait, type PortraitSample } from "@/lib/portrait-sampler";
import { portraitFragmentShader, portraitVertexShader } from "@/lib/portrait-shaders";
import { PortraitSkeleton } from "./portrait-skeleton";

const FOV = 35;
/** Empty space around the portrait inside its box. */
const FIT_MARGIN = 1.06;
/** Dots larger than the spacing so they blend into a sharp image. */
const COVERAGE = 2.2;
/** The canvas is this many times larger than the portrait box so scattered dots never clip. */
const CANVAS_SCALE = 2.2;
/** Cap on framebuffer pixels so the oversized canvas stays cheap on retina screens. */
const MAX_CANVAS_PIXELS = 8_000_000;
const RESIZE_DEBOUNCE_MS = 120;
/** Fallback accent (dark theme) if the CSS variable cannot be read. */
const FALLBACK_ACCENT = new Vector3(0.91, 0.66, 0.49);
const MAX_TILT_Y = 0.14;
const MAX_TILT_X = 0.09;

export type PortraitShape = "round" | "square";

interface PortraitParticlesProps {
  src?: string;
  alt: string;
  shape?: PortraitShape;
  /**
   * Scatter amount, 0 (portrait assembled) to 1 (fully scattered).
   * Typically a scroll-linked MotionValue; reversing it reassembles the portrait.
   */
  progress?: MotionValue<number>;
  /** Overrides the device-based particle target. */
  targetCount?: number;
  /**
   * Fade the bottom of the portrait: [y where alpha is 1, y where it reaches 0], with the
   * portrait spanning y = +0.5 (top) to -0.5 (bottom). Off by default.
   */
  fadeBottom?: readonly [number, number];
  /** Called once the particles are on screen (e.g. to start an intro animation). */
  onReady?: () => void;
  className?: string;
}

interface SceneHandle {
  setShape: (shape: PortraitShape) => void;
  dispose: () => void;
}

interface SceneOptions {
  /** Carries the data-* stats; also the visibility target. */
  wrapper: HTMLElement;
  /** Parent of the canvas. */
  host: HTMLElement;
  sample: PortraitSample;
  tier: DeviceTier;
  shape: PortraitShape;
  /** Mouse tilt: only for fine pointers, never with reduced motion. */
  tilt: boolean;
  progress: MotionValue<number> | undefined;
  fadeBottom: readonly [number, number] | undefined;
  /** Called if the WebGL context is lost later on. */
  onContextLost: () => void;
}

let webglSupport: boolean | null = null;

/** Cheap one-off probe; the probe context is released straight away. */
function webglAvailable(): boolean {
  // Dev-only switch (`?webgl=off`) to see the no-WebGL fallback.
  if (
    process.env.NODE_ENV !== "production" &&
    new URLSearchParams(window.location.search).get("webgl") === "off"
  ) {
    return false;
  }
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webglSupport = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/** Reads `--accent` (a #rrggbb hex) as raw sRGB components, which is what the shader outputs. */
function readAccent(target: Vector3) {
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (m)
    target.set(
      parseInt(m[1], 16) / 255,
      parseInt(m[2], 16) / 255,
      parseInt(m[3], 16) / 255,
    );
  else target.copy(FALLBACK_ACCENT);
}

/** Dev-only override (`?minfps=500`) so the fps guard can be exercised without a slow machine. */
function minFps(): number {
  if (process.env.NODE_ENV !== "production") {
    const override = Number(new URLSearchParams(window.location.search).get("minfps"));
    if (override > 0) return override;
  }
  return FPS_GUARD.minFps;
}

function createScene(opts: SceneOptions): SceneHandle {
  const { wrapper, host, sample, tier, tilt, progress, fadeBottom } = opts;
  const half = Math.tan((FOV * Math.PI) / 360);

  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText =
    "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;display:block";
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 20);

  const origin = new BufferAttribute(sample.origin, 3);
  const geometry = new BufferGeometry();
  // `position` is what Three counts vertices from; aOrigin shares the same buffer.
  geometry.setAttribute("position", origin);
  geometry.setAttribute("aOrigin", origin);
  geometry.setAttribute("aColor", new BufferAttribute(sample.color, 3));
  geometry.setAttribute("aAlpha", new BufferAttribute(sample.alpha, 1));
  geometry.setAttribute("aSize", new BufferAttribute(sample.size, 1));
  geometry.setAttribute("aRandom", new BufferAttribute(sample.random, 4));
  geometry.setAttribute("aDelay", new BufferAttribute(sample.delay, 1));

  const material = new ShaderMaterial({
    vertexShader: portraitVertexShader,
    fragmentShader: portraitFragmentShader,
    uniforms: {
      uPointScale: { value: 1 },
      uShape: { value: opts.shape === "square" ? 1 : 0 },
      uProgress: { value: 0 },
      uFocus: { value: new Vector2(sample.focus[0], sample.focus[1]) },
      uAccent: { value: new Vector3().copy(FALLBACK_ACCENT) },
      uAccentMix: { value: DISINTEGRATE.accentMix },
      uFadeY: { value: new Vector2(fadeBottom?.[0] ?? -10, fadeBottom?.[1] ?? -11) },
      uMono: { value: 0 },
      uGlow: { value: 0 },
      uPhotoTint: { value: PORTRAIT_LOOK.photoTint },
      uSizeBoost: { value: 1 },
    },
    // Fewer noise octaves on phones keeps the vertex shader cheap.
    defines: { OCTAVES: tier.mobile ? 1 : 2 },
    transparent: true,
    depthWrite: false,
  });
  readAccent(material.uniforms.uAccent.value as Vector3);

  // Second pass, additive: a soft glow on particles that have left the portrait (dark theme only).
  const glowMaterial = new ShaderMaterial({
    vertexShader: portraitVertexShader,
    fragmentShader: portraitFragmentShader,
    uniforms: material.uniforms,
    defines: { OCTAVES: tier.mobile ? 1 : 2, GLOW_PASS: 1 },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const glowPoints = new Points(geometry, glowMaterial);
  glowPoints.frustumCulled = false;
  glowPoints.renderOrder = 1;
  const group = new Group();
  group.add(points, glowPoints);
  scene.add(group);

  // ---- State -------------------------------------------------------------------------
  let dirty = true;
  let running = false;
  let visible = false;
  let raf = 0;
  let resizeTimer = 0;
  let dprNow = 1;
  let layouts = 0;
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  // Scatter amount, eased toward the scroll value so wheel steps never look jumpy.
  const scatter = { value: progress?.get() ?? 0, target: progress?.get() ?? 0 };
  material.uniforms.uProgress.value = scatter.value;

  // Theme: 0 = dark (warm off-white + glow pass), 1 = light (dark ink).
  const themeValue = () => (document.documentElement.classList.contains("dark") ? 0 : 1);
  const mono = { value: themeValue(), target: themeValue() };
  const applyMono = () => {
    material.uniforms.uMono.value = mono.value;
    // The glow fades out as the light theme takes over, and is not drawn at all in light.
    const glow = PORTRAIT_LOOK.darkGlow ? PORTRAIT_LOOK.glow * (1 - mono.value) : 0;
    material.uniforms.uGlow.value = glow;
    glowPoints.visible = glow > 0.005;
  };
  applyMono();

  // Quality: the fps guard lowers resolution first, then the number of particles drawn.
  const quality = { step: 0, dprCap: tier.maxDpr };
  const applyQuality = () => {
    const f = FPS_GUARD.fractions[quality.step];
    geometry.setDrawRange(0, Math.max(1, Math.floor(sample.count * f)));
    // Fewer dots must still cover the picture: grow them to keep the same coverage.
    // A random subset leaves gaps, so grow a little more than 1/sqrt(f).
    material.uniforms.uSizeBoost.value = Math.pow(f, -0.62);
    wrapper.dataset.quality = `${f}@${dprNow.toFixed(2)}`;
  };

  // ---- Layout ------------------------------------------------------------------------
  const layout = () => {
    const boxW = wrapper.clientWidth;
    const boxH = wrapper.clientHeight;
    if (!boxW || !boxH) return;

    const canvasW = Math.round(boxW * CANVAS_SCALE);
    const canvasH = Math.round(boxH * CANVAS_SCALE);
    dprNow = Math.min(
      window.devicePixelRatio || 1,
      quality.dprCap,
      Math.sqrt(MAX_CANVAS_PIXELS / (canvasW * canvasH)),
    );
    renderer.setPixelRatio(dprNow);
    renderer.setSize(canvasW, canvasH, false);
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;
    camera.aspect = canvasW / canvasH;

    // Fit the portrait inside the box (by height or, if narrower, by width);
    // the larger canvas just adds empty room around it.
    const boxVisibleH = Math.max(
      FIT_MARGIN,
      (sample.aspect * FIT_MARGIN) / (boxW / boxH),
    );
    camera.position.z = (boxVisibleH * CANVAS_SCALE) / 2 / half;
    camera.updateProjectionMatrix();

    material.uniforms.uPointScale.value =
      (sample.spacing * canvasH * dprNow * COVERAGE) / (2 * half);
    applyQuality();
    wrapper.dataset.layouts = String(++layouts);
    dirty = true;
  };

  // ---- FPS guard ---------------------------------------------------------------------
  const readyAt = performance.now();
  let guardSum = 0;
  let guardCount = 0;
  let guardStart = 0;
  let prevRendered = false;

  const degrade = () => {
    if (dprNow > FPS_GUARD.minDpr + 1e-3) {
      quality.dprCap = Math.max(FPS_GUARD.minDpr, dprNow - FPS_GUARD.dprStep);
      layout();
    } else if (quality.step < FPS_GUARD.fractions.length - 1) {
      quality.step++;
      applyQuality();
    } else {
      return;
    }
    dirty = true;
  };

  // ---- Render loop -------------------------------------------------------------------
  let lastTime = 0;
  let frames = 0;
  let renders = 0;
  let skipped = 0;
  let renderMs = 0;
  let intervalMs = 16.7;
  let blankDrawn = false;

  const frame = (now: number) => {
    raf = 0;
    if (!running) return;
    const rawDt = lastTime ? (now - lastTime) / 1000 : 1 / 60;
    // Clamped so a stall (or tab switch) never makes the easing jump.
    const dt = Math.min(0.05, rawDt);
    if (lastTime) intervalMs += (dt * 1000 - intervalMs) * 0.1;
    lastTime = now;

    if (tilt) {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      const ry = current.x * MAX_TILT_Y;
      const rx = current.y * MAX_TILT_X;
      if (
        Math.abs(ry - group.rotation.y) > 1e-5 ||
        Math.abs(rx - group.rotation.x) > 1e-5
      ) {
        group.rotation.y = ry;
        group.rotation.x = rx;
        wrapper.dataset.tilt = `${ry.toFixed(3)},${rx.toFixed(3)}`;
        dirty = true;
      }
    }

    // Frame-rate-independent damping: silky on scroll, no jerk on fast flicks.
    const gap = scatter.target - scatter.value;
    if (Math.abs(gap) > 1e-4) {
      scatter.value += gap * (1 - Math.exp(-dt / DISINTEGRATE.tau));
      if (Math.abs(scatter.target - scatter.value) <= 1e-4)
        scatter.value = scatter.target;
      material.uniforms.uProgress.value = scatter.value;
      wrapper.dataset.progress = scatter.value.toFixed(4);
      dirty = true;
    }

    const monoGap = mono.target - mono.value;
    if (Math.abs(monoGap) > 1e-3) {
      mono.value += monoGap * (1 - Math.exp(-dt / PORTRAIT_LOOK.themeTau));
      if (Math.abs(mono.target - mono.value) <= 1e-3) mono.value = mono.target;
      applyMono();
      dirty = true;
    }

    // Fully scattered: every particle is invisible, so draw one blank frame, then stop
    // drawing until progress comes back down.
    const blank = scatter.value >= PORTRAIT_LOOK.blankAt;
    if (!blank) blankDrawn = false;

    let rendered = false;
    if (dirty) {
      if (blank && blankDrawn) {
        skipped++;
      } else {
        const t0 = performance.now();
        renderer.render(scene, camera);
        renderMs += (performance.now() - t0 - renderMs) * 0.1;
        renders++;
        rendered = true;
        if (blank) blankDrawn = true;
      }
      dirty = false;
    }

    // FPS guard: average frame time over consecutive *rendered* frames (idle frames say
    // nothing about GPU load). Below the floor for a whole window: lower the quality.
    if (
      rendered &&
      prevRendered &&
      rawDt < 0.25 &&
      !document.hidden &&
      now - readyAt > FPS_GUARD.warmupMs
    ) {
      if (!guardCount) guardStart = now;
      guardSum += rawDt;
      guardCount++;
    }
    prevRendered = rendered;
    if (guardCount && now - guardStart >= FPS_GUARD.windowMs) {
      if (guardCount >= FPS_GUARD.minSamples && guardCount / guardSum < minFps())
        degrade();
      guardSum = 0;
      guardCount = 0;
    }

    if (++frames % 10 === 0) {
      wrapper.dataset.frameMs = intervalMs.toFixed(1);
      wrapper.dataset.renderMs = renderMs.toFixed(2);
      wrapper.dataset.renders = String(renders);
      wrapper.dataset.skipped = String(skipped);
    }
    raf = requestAnimationFrame(frame);
  };

  const snapIdleState = () => {
    // While not animating, follow the scroll value exactly so re-entering never replays
    // a stale catch-up animation.
    scatter.value = scatter.target;
    material.uniforms.uProgress.value = scatter.value;
    wrapper.dataset.progress = scatter.value.toFixed(4);
    mono.value = mono.target;
    applyMono();
    dirty = true;
  };

  const sync = () => {
    const shouldRun = visible && !document.hidden;
    if (shouldRun === running) return;
    running = shouldRun;
    wrapper.dataset.running = String(running);
    lastTime = 0;
    prevRendered = false;
    guardCount = 0;
    if (running && !raf) raf = requestAnimationFrame(frame);
    if (!running && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (!running) snapIdleState();
  };

  // ---- Observers and listeners -------------------------------------------------------
  const resizeObserver = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(layout, RESIZE_DEBOUNCE_MS);
  });
  resizeObserver.observe(wrapper);

  const intersectionObserver = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    sync();
  });
  intersectionObserver.observe(wrapper);
  document.addEventListener("visibilitychange", sync);

  const unsubscribePointer = tilt
    ? subscribePointer((x, y) => {
        target.x = (x / window.innerWidth) * 2 - 1;
        target.y = (y / window.innerHeight) * 2 - 1;
      })
    : null;

  const unsubscribeProgress =
    progress?.on("change", (v) => {
      scatter.target = Math.min(1, Math.max(0, v));
      if (!running) snapIdleState();
    }) ?? null;

  // Theme class on <html> changes: recolour (eased) and re-read the accent.
  const themeObserver = new MutationObserver(() => {
    readAccent(material.uniforms.uAccent.value as Vector3);
    mono.target = themeValue();
    if (!running) snapIdleState();
    dirty = true;
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  const onContextLost = (event: Event) => {
    event.preventDefault();
    opts.onContextLost();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  layout();
  renderer.render(scene, camera);
  dirty = false;
  wrapper.dataset.particles = String(sample.count);
  wrapper.dataset.sampleMs = sample.sampleMs.toFixed(0);
  wrapper.dataset.ready = "true";

  return {
    setShape: (next) => {
      material.uniforms.uShape.value = next === "square" ? 1 : 0;
      dirty = true;
    },
    dispose: () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      running = false;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      unsubscribePointer?.();
      unsubscribeProgress?.();
      geometry.dispose();
      material.dispose();
      glowMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      for (const key of Object.keys(wrapper.dataset)) delete wrapper.dataset[key];
    },
  };
}

/** Plain picture for browsers without WebGL (or if the scene dies), softly faded at the bottom. */
function FallbackPortrait({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <div
      className={cn(
        "relative size-full [mask-image:linear-gradient(to_bottom,#000_56%,transparent_97%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_56%,transparent_97%)]",
        className,
      )}
    >
      {broken ? null : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-contain"
          onError={() => setBroken(true)}
        />
      )}
    </div>
  );
}

/**
 * Particle portrait. Fills its parent: give the parent the image's aspect ratio.
 *
 * - Shows a silhouette shimmer until the image is decoded and the first frame is drawn.
 * - Falls back to a plain faded <Image> if WebGL or the image is unavailable.
 * - Reduced motion: a static portrait, no scatter and no tilt.
 */
export function PortraitParticles({
  src = "/images/portrait.png",
  alt,
  shape = "round",
  progress,
  targetCount,
  fadeBottom,
  onReady,
  className,
}: PortraitParticlesProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const shapeRef = useRef(shape);
  const onReadyRef = useRef(onReady);
  const fadeRef = useRef(fadeBottom);
  // This component only renders in the browser (dynamic, ssr: false), so probing is safe.
  const [failed, setFailed] = useState(() => !webglAvailable());
  const reduceMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();

  useEffect(() => {
    onReadyRef.current = onReady;
    fadeRef.current = fadeBottom;
  });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const host = hostRef.current;
    if (!wrapper || !host || failed) return;
    let cancelled = false;

    (async () => {
      try {
        const tier = getDeviceTier();
        const sample = await samplePortrait(src, {
          targetCount: targetCount ?? tier.particles,
        });
        if (cancelled) return;
        handleRef.current = createScene({
          wrapper,
          host,
          sample,
          tier,
          shape: shapeRef.current,
          // Touch devices and reduced motion get no parallax tilt.
          tilt: finePointer && !reduceMotion,
          progress: reduceMotion ? undefined : progress,
          fadeBottom: fadeRef.current,
          onContextLost: () => setFailed(true),
        });
        onReadyRef.current?.();
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [src, targetCount, reduceMotion, finePointer, progress, failed]);

  useEffect(() => {
    shapeRef.current = shape;
    handleRef.current?.setShape(shape);
  }, [shape]);

  if (failed) return <FallbackPortrait src={src} alt={alt} className={className} />;

  return (
    <div
      ref={wrapperRef}
      role="img"
      aria-label={alt}
      className={cn("group relative size-full", className)}
    >
      <PortraitSkeleton className="absolute inset-0 transition-opacity duration-700 group-data-[ready=true]:opacity-0" />
      <div
        ref={hostRef}
        className="absolute inset-0 opacity-0 transition-opacity duration-1000 group-data-[ready=true]:opacity-100"
      />
    </div>
  );
}
