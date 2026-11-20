/**
 * Single place to update when the portrait photo changes.
 * `aspect` = width / height of public/images/portrait.png (after prepare-portrait.py).
 */
export const PORTRAIT = {
  src: "/images/portrait.png",
  aspect: 960 / 825,
} as const;
