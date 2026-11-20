#!/usr/bin/env python3
"""
Turn a photo into a hero-ready particle portrait: background removed,
cropped to a bust, with a soft fade at the bottom/left so nothing looks cut.

Setup (once, Python 3.13 recommended):
    python3.13 -m venv .venv && .venv/bin/pip install "rembg[cpu]" pillow

Usage:
    .venv/bin/python scripts/prepare-portrait.py \
        scripts/source/portrait-original.png public/images/portrait.png

Crop / fade values are in ORIGINAL-photo pixels. Adjust them for a new photo
(see --help). The first run downloads the ~170 MB segmentation model.
"""
import argparse

import numpy as np
from PIL import Image
from rembg import new_session, remove


def smoothstep(edge0: float, edge1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("dst")
    p.add_argument("--crop", default="225,0,545,265", help="x0,y0,x1,y1 in source pixels")
    p.add_argument("--fade-bottom", default="180,262", help="alpha 1 -> 0 between these y values")
    p.add_argument("--fade-left", default="232,290", help="alpha 0 -> 1 between these x values")
    p.add_argument("--pad-top", type=int, default=10, help="transparent px above the crop")
    p.add_argument("--scale", type=int, default=3, help="Lanczos upscale factor")
    args = p.parse_args()

    img = Image.open(args.src).convert("RGB")
    session = new_session("u2net_human_seg")
    cut = remove(
        img,
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=15,
        alpha_matting_erode_size=8,
    ).convert("RGBA")

    # Feather in source coordinates, before cropping.
    arr = np.asarray(cut).astype(np.float32)
    h, w = arr.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    b0, b1 = (float(v) for v in args.fade_bottom.split(","))
    l0, l1 = (float(v) for v in args.fade_left.split(","))
    mask = (1.0 - smoothstep(b0, b1, ys)) * smoothstep(l0, l1, xs)
    arr[..., 3] *= mask
    # Drop faint matting noise so stray specks never become particles.
    arr[..., 3] = np.where(arr[..., 3] < 10, 0, arr[..., 3])
    cut = Image.fromarray(arr.astype(np.uint8), "RGBA")

    x0, y0, x1, y1 = (int(v) for v in args.crop.split(","))
    bust = cut.crop((x0, y0, x1, y1))
    canvas = Image.new("RGBA", (bust.width, bust.height + args.pad_top), (0, 0, 0, 0))
    canvas.paste(bust, (0, args.pad_top))
    canvas = canvas.resize(
        (canvas.width * args.scale, canvas.height * args.scale), Image.LANCZOS
    )
    canvas.save(args.dst, optimize=True)
    print(f"saved {args.dst} {canvas.size} bbox={canvas.getbbox()}")


if __name__ == "__main__":
    main()
