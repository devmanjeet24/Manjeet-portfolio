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
  WebGLRenderer,
} from "three";
import { getDeviceTier, type DeviceTier } from "@/lib/device-tier";
import { subscribePointer } from "@/lib/pointer";
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
  className?: string;
}

interface SceneHandle {
  setShape: (shape: PortraitShape) => void;
  dispose: () => void;
}

function createScene(
  wrapper: HTMLElement,
  sample: PortraitSample,
  tier: DeviceTier,
  shape: PortraitShape,
  tilt: boolean,
  progress: MotionValue<number> | undefined,
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

  const material = new ShaderMaterial({
    vertexShader: portraitVertexShader,
    fragmentShader: portraitFragmentShader,
    uniforms: {
      uPointScale: { value: 1 },
      uShape: { value: shape === "square" ? 1 : 0 },
      uProgress: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
  });

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

  const frame = () => {
    raf = 0;
    if (!running) return;
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
    if (Math.abs(scatter.target - scatter.value) > 5e-4) {
      scatter.value += (scatter.target - scatter.value) * 0.14;
      material.uniforms.uProgress.value = scatter.value;
      wrapper.dataset.progress = scatter.value.toFixed(3);
      dirty = true;
    }
    if (dirty) {
      renderer.render(scene, camera);
      dirty = false;
    }
    raf = requestAnimationFrame(frame);
  };

  const sync = () => {
    const shouldRun = visible && !document.hidden;
    if (shouldRun === running) return;
    running = shouldRun;
    wrapper.dataset.running = String(running);
    if (running && !raf) raf = requestAnimationFrame(frame);
    if (!running && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
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
    }) ?? null;

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
  className,
}: PortraitParticlesProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const shapeRef = useRef(shape);
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
          () => setFailed(true),
        );
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
