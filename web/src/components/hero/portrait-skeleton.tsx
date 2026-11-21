import { cn } from "@/lib/cn";
import { PORTRAIT } from "@/lib/portrait-config";

/**
 * A generic bust silhouette, inline (no network): head and shoulders placed where the real
 * face sits (`PORTRAIT.faceX`). It must not depend on portrait.png, because that file is
 * exactly what is still downloading while the skeleton is shown.
 */
const faceX = Math.round(PORTRAIT.faceX * 960);
const SILHOUETTE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 825'>` +
    `<ellipse cx='${faceX}' cy='270' rx='150' ry='195'/>` +
    `<rect x='${faceX - 55}' y='430' width='110' height='140' rx='40'/>` +
    `<path d='M${faceX - 300} 825 C${faceX - 280} 610 ${faceX - 140} 520 ${faceX} 520 C${faceX + 140} 520 ${faceX + 290} 610 ${faceX + 320} 825 Z'/>` +
    `</svg>`,
)}")`;

/**
 * Loading placeholder: a soft shimmering bust silhouette in the exact box the particles
 * will use, so nothing shifts when they appear.
 */
export function PortraitSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "size-full animate-[shimmer_2.2s_linear_infinite] bg-[linear-gradient(100deg,var(--border)_30%,var(--border-strong)_50%,var(--border)_70%)] bg-[length:200%_100%] opacity-60",
        className,
      )}
      style={{
        maskImage: SILHOUETTE,
        WebkitMaskImage: SILHOUETTE,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
