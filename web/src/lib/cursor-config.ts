/** Master switches for the pointer-interaction system. */

/** Fading canvas trail behind the cursor. Off by default. */
export const CURSOR_TRAIL_ENABLED = false;

/** How long a trail segment stays visible (ms). */
export const CURSOR_TRAIL_LIFETIME = 450;

/** Spotlight glow diameter (px). Keep in sync with `.cursor-spotlight` in globals.css. */
export const SPOTLIGHT_SIZE = 900;

/** Extra distance (px) around a magnetic element where the pull starts. */
export const MAGNET_RANGE = 48;

/** Largest distance (px) a magnetic element may be pulled; smaller than the gap between controls. */
export const MAGNET_MAX_SHIFT = 14;
