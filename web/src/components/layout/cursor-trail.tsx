"use client";

import { useEffect, useRef } from "react";
import { CURSOR_TRAIL_LIFETIME } from "@/lib/cursor-config";
import { subscribePointer } from "@/lib/pointer";

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

const MAX_POINTS = 60;

/** Optional fading canvas trail. The rAF loop only runs while points are alive. */
export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const points: TrailPoint[] = [];
    let frame = 0;
    let color = "#ffffff";

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      while (points.length && now - points[0].t > CURSOR_TRAIL_LIFETIME) points.shift();
      if (points.length < 2) {
        frame = 0;
        return;
      }
      ctx.strokeStyle = color;
      for (let i = 1; i < points.length; i++) {
        const life = 1 - (now - points[i].t) / CURSOR_TRAIL_LIFETIME;
        ctx.globalAlpha = Math.max(0, life) * 0.5;
        ctx.lineWidth = 1 + life * 2;
        ctx.beginPath();
        ctx.moveTo(points[i - 1].x, points[i - 1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
      }
      frame = requestAnimationFrame(draw);
    };

    const unsubscribe = subscribePointer((x, y) => {
      points.push({ x, y, t: performance.now() });
      if (points.length > MAX_POINTS) points.shift();
      if (!frame) {
        color =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--accent")
            .trim() || color;
        frame = requestAnimationFrame(draw);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", resize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9997] size-full"
    />
  );
}
