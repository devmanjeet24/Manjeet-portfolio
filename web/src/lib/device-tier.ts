export interface DeviceTier {
  /** Target particle count. */
  particles: number;
  /** Cap for devicePixelRatio. */
  maxDpr: number;
  mobile: boolean;
  /** Weak hardware, small screen or Save-Data: fewer particles. */
  low: boolean;
}

interface NavigatorExtras extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/**
 * Picks a particle budget from what the browser reveals: core count, device memory,
 * screen width, touch and Save-Data. The runtime fps guard lowers it further if needed.
 */
export function getDeviceTier(): DeviceTier {
  const nav = navigator as NavigatorExtras;
  const width = Math.min(window.innerWidth, window.screen?.width ?? window.innerWidth);
  const mobile =
    window.matchMedia("(max-width: 767px)").matches ||
    window.matchMedia("(pointer: coarse)").matches;
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  const saveData = nav.connection?.saveData === true;

  const veryLow = cores <= 2 || memory <= 2;
  const low = veryLow || cores <= 4 || memory <= 4 || saveData;

  let particles: number;
  let maxDpr: number;
  if (mobile) {
    particles = veryLow ? 12_000 : low ? 20_000 : 32_000;
    maxDpr = low ? 1.25 : 1.5;
    if (width <= 380) particles = Math.round(particles * 0.8);
  } else {
    particles = veryLow ? 40_000 : low ? 70_000 : 130_000;
    maxDpr = low ? 1.5 : 2;
  }
  if (saveData) particles = Math.round(particles * 0.6);

  return { particles, maxDpr, mobile, low };
}
