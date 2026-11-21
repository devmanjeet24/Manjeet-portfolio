"use client";

import { useReducedMotion, type MotionValue } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
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
import { getDeviceTier, type DeviceTier } from "@/lib/device-tier";
import { subscribePointer } from "@/lib/pointer";
import { DISINTEGRATE } from "@/lib/portrait-config";
import { samplePortrait, type PortraitSample } from "@/lib/portrait-sampler";
import { portraitFragmentShader, portraitVertexShader } from "@/lib/portrait-shaders";
import { cn } from "@/lib/cn";

const FOV = 35;
/** Empty space around the portrait inside its box. */
const FIT_MARGIN = 1.06;
/** Dots slightly larger than the spacing so they blend into a sharp image. */
const COVERAGE = 2.2;
/** The canvas is this many times larger than the portrait box so scattered dots never clip. */
const CANVAS_SCALE = 2.2;
/** Cap on framebuffer pixels so the oversized canvas stays cheap on retina screens. */
const MAX_CANVAS_PIXELS = 8_000_000;
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

function createScene(
  wrapper: HTMLElement,
  sample: PortraitSample,
  tier: DeviceTier,
  shape: PortraitShape,
  tilt: boolean,
  progress: MotionValue<number> | undefined,
  fadeBottom: readonly [number, number] | undefined,
  onFail: () => void,
): SceneHandle {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText =
    "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;display:block";
  wrapper.appendChild(canvas);

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
      uShape: { value: shape === "square" ? 1 : 0 },
      uProgress: { value: 0 },
      uFocus: { value: new Vector2(sample.focus[0], sample.focus[1]) },
      uAccent: { value: new Vector3().copy(FALLBACK_ACCENT) },
      uAccentMix: { value: DISINTEGRATE.accentMix },
      uFadeY: { value: new Vector2(fadeBottom?.[0] ?? -10, fadeBottom?.[1] ?? -11) },
      uMono: { value: 0 },
    },
    // Fewer noise octaves on phones keeps the vertex shader cheap.
    defines: { OCTAVES: tier.mobile ? 1 : 2 },
    transparent: true,
    depthWrite: false,
  });

  readAccent(material.uniforms.uAccent.value as Vector3);
  // Light theme (no `dark` class) switches the particles to dark ink; eased when toggled.
  const isLight = () => (document.documentElement.classList.contains("dark") ? 0 : 1);
  const mono = { value: isLight(), target: isLight() };
  material.uniforms.uMono.value = mono.value;

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const group = new Group();
  group.add(points);
  scene.add(group);

  let dirty = true;
  let running = false;
  let visible = false;
  let raf = 0;
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  // Scatter amount: eased toward the scroll value so wheel steps never look jumpy.
  const scatter = { value: progress?.get() ?? 0, target: progress?.get() ?? 0 };
  material.uniforms.uProgress.value = scatter.value;

  const layout = () => {
    const boxW = wrapper.clientWidth;
    const boxH = wrapper.clientHeight;
    if (!boxW || !boxH) return;

    const canvasW = Math.round(boxW * CANVAS_SCALE);
    const canvasH = Math.round(boxH * CANVAS_SCALE);
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      tier.maxDpr,
      Math.sqrt(MAX_CANVAS_PIXELS / (canvasW * canvasH)),
    );
    renderer.setPixelRatio(dpr);
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
    camera.position.z =
      (boxVisibleH * CANVAS_SCALE) / 2 / Math.tan((FOV * Math.PI) / 360);
    camera.updateProjectionMatrix();

    material.uniforms.uPointScale.value =
      (sample.spacing * canvasH * dpr * COVERAGE) / (2 * Math.tan((FOV * Math.PI) / 360));
    dirty = true;
  };

  let lastTime = 0;
  let frames = 0;
  let renderMs = 0;
  let intervalMs = 16.7;

  const frame = (now: number) => {
    raf = 0;
    if (!running) return;
    // Seconds since the last frame; clamped so a tab switch never causes a jump.
    const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
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
    if (dirty) {
      const t0 = performance.now();
      renderer.render(scene, camera);
      renderMs += (performance.now() - t0 - renderMs) * 0.1;
      dirty = false;
    }
    const monoGap = mono.target - mono.value;
    if (Math.abs(monoGap) > 1e-3) {
      mono.value += monoGap * (1 - Math.exp(-dt / 0.12));
      material.uniforms.uMono.value = mono.value;
      dirty = true;
    }
    // Light-weight stats for the debug panel and tests (every 30 frames).
    if (++frames % 30 === 0) {
      wrapper.dataset.frameMs = intervalMs.toFixed(1);
      wrapper.dataset.renderMs = renderMs.toFixed(2);
    }
    raf = requestAnimationFrame(frame);
  };

  const sync = () => {
    const shouldRun = visible && !document.hidden;
    if (shouldRun === running) return;
    running = shouldRun;
    wrapper.dataset.running = String(running);
    lastTime = 0;
    if (running && !raf) raf = requestAnimationFrame(frame);
    if (!running && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    // Stopping mid-ease (e.g. a long jump away) must not leave a stale value behind:
    // snap to where scroll says we are, so re-entering never replays a catch-up.
    if (!running && scatter.value !== scatter.target) {
      scatter.value = scatter.target;
      material.uniforms.uProgress.value = scatter.value;
      wrapper.dataset.progress = scatter.value.toFixed(4);
      dirty = true;
    }
  };

  const resizeObserver = new ResizeObserver(layout);
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
      // While not animating (off-screen or hidden tab) follow the scroll value exactly,
      // so coming back into view never replays a stale catch-up animation.
      if (!running) {
        scatter.value = scatter.target;
        material.uniforms.uProgress.value = scatter.value;
        wrapper.dataset.progress = scatter.value.toFixed(4);
        dirty = true;
      }
    }) ?? null;

  // Re-read the accent when the theme class on <html> changes.
  const themeObserver = new MutationObserver(() => {
    readAccent(material.uniforms.uAccent.value as Vector3);
    mono.target = isLight();
    if (!running) {
      mono.value = mono.target;
      material.uniforms.uMono.value = mono.value;
    }
    dirty = true;
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  const onContextLost = (event: Event) => {
    event.preventDefault();
    onFail();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  layout();
  renderer.render(scene, camera);
  dirty = false;
  wrapper.dataset.particles = String(sample.count);
  wrapper.dataset.ready = "true";

  return {
    setShape: (next) => {
      material.uniforms.uShape.value = next === "square" ? 1 : 0;
      dirty = true;
    },
    dispose: () => {
      if (raf) cancelAnimationFrame(raf);
      running = false;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      unsubscribePointer?.();
      unsubscribeProgress?.();
      themeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      delete wrapper.dataset.ready;
      delete wrapper.dataset.running;
      delete wrapper.dataset.particles;
      delete wrapper.dataset.tilt;
      delete wrapper.dataset.progress;
      delete wrapper.dataset.frameMs;
      delete wrapper.dataset.renderMs;
    },
  };
}

/** Static particle portrait. Fills its parent; give the parent the image's aspect ratio. */
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
  const handleRef = useRef<SceneHandle | null>(null);
  const shapeRef = useRef(shape);
  const onReadyRef = useRef(onReady);
  const fadeRef = useRef(fadeBottom);
  useEffect(() => {
    onReadyRef.current = onReady;
    fadeRef.current = fadeBottom;
  });
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || failed) return;
    let cancelled = false;

    (async () => {
      try {
        const tier = getDeviceTier();
        const sample = await samplePortrait(src, {
          targetCount: targetCount ?? tier.particles,
        });
        if (cancelled) return;
        handleRef.current = createScene(
          wrapper,
          sample,
          tier,
          shapeRef.current,
          !reduceMotion,
          reduceMotion ? undefined : progress,
          fadeRef.current,
          () => setFailed(true),
        );
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
  }, [src, targetCount, reduceMotion, progress, failed]);

  useEffect(() => {
    shapeRef.current = shape;
    handleRef.current?.setShape(shape);
  }, [shape]);

  if (failed) {
    // WebGL or image unavailable: show the plain portrait.
    return (
      <div className={cn("relative size-full", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-contain"
        />
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      role="img"
      aria-label={alt}
      className={cn(
        "relative size-full opacity-0 transition-opacity duration-1000 data-[ready=true]:opacity-100",
        className,
      )}
    />
  );
}
