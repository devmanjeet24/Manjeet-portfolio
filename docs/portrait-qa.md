# Portrait particles: manual QA checklist

Run `cd web && npm run dev`, then open `http://localhost:3000/`.

## Dev-only switches (ignored in production builds)
| URL | Effect |
|---|---|
| `/?debug=1` | Bottom-right panel: scrub progress by hand, live stats (frame ms, cpu render ms, particles, quality @dpr, draws / skipped, sample ms) |
| `/?debug=1&minfps=500` | Pretends the machine can never reach 500 fps, so the fps guard steps quality down (1 → 0.8 → 0.62 → 0.48 → 0.36) |
| `/?webgl=off` | Forces the no-WebGL fallback (plain image with a soft mask) |

## Checklist
**Fast scroll**
- [ ] Flick the wheel hard from the top down through the hero: no jerk, particles keep flowing, no console errors.
- [ ] Jump with the End key or by clicking "Explore my work": portrait is gone, no stutter.
- [ ] At the bottom of the hero (fully scattered) the debug panel's "draws" stops increasing.

**Scroll back**
- [ ] Scroll slowly back to the top: the same particles fly back and the portrait is rebuilt, identical to the first frame.
- [ ] Jump from far below straight back to the top: portrait rebuilds smoothly, never "assembled, then breaks again".
- [ ] Scroll up from About into the bottom of the hero: nothing glitches on re-entry.

**Resize**
- [ ] Drag the window edge for a few seconds: layout follows after you stop (debounced), no flicker, no blank canvas.
- [ ] Debug panel: quality stays `1@...` on a healthy machine.
- [ ] Rotate the phone / flip device emulation: portrait refits.

**Theme toggle**
- [ ] Dark: warm off-white portrait, scattering particles glow.
- [ ] Light: dark ink dots, no glow, text readable.
- [ ] Toggle quickly several times, also mid-scatter: colours ease (about 0.3 s), no flash.
- [ ] Reload in each theme: no flash of the wrong theme.

**Mobile emulation** (DevTools device toolbar, e.g. iPhone 14, CPU throttle 4x)
- [ ] Particles drop to ~32k (about 12k on a weak device); no mouse tilt, no hero parallax.
- [ ] Scatter and rebuild still smooth; panel shows `quality` stepping down if the CPU throttle makes it slow.
- [ ] Portrait is large, name below, no horizontal scroll.

**Reduced motion** (DevTools > Rendering > Emulate prefers-reduced-motion)
- [ ] Static portrait: no intro assembly, no scatter, no tilt; hero is one screen tall, not sticky.

**Fallbacks and loading**
- [ ] `/?webgl=off`: plain portrait with a soft bottom fade, same size as the particle version.
- [ ] DevTools > Network > Slow 3G (or block `portrait.png`): a soft head-and-shoulders shimmer holds the space, then the portrait appears with no layout jump.
- [ ] Block `portrait.png` entirely: hero text and buttons stay intact, no errors.

**Tab and lifecycle**
- [ ] Switch to another tab and back: animation resumes, no jump.
- [ ] Navigate away and back a few times (Back/Forward): memory stays flat (DevTools > Memory, take a heap snapshot after each round); the canvas disappears when the hero is gone.
