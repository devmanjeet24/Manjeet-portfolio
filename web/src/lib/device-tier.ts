export interface DeviceTier {
  /** Target particle count. */
  particles: number;
  /** Cap for devicePixelRatio. */
  maxDpr: number;
  mobile: boolean;
}

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

/** Rough capability check; browser only. */
export function getDeviceTier(): DeviceTier {
  const mobile =
    window.matchMedia("(max-width: 767px)").matches ||
    window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 8;
  const low = cores <= 4 || memory <= 4;

  if (mobile) return { particles: low ? 20_000 : 32_000, maxDpr: 1.5, mobile };
  return { particles: low ? 70_000 : 130_000, maxDpr: 2, mobile };
}
