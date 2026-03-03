# AnimPath — Next Steps

Prioritized recommendations for improving AnimPath (stroke-based SVG animation library).

---

## Current Progress (Updated March 2, 2026)

**Completed:**
- Configurable logger: added `logger?: { warn: (msg: string) => void }` option to `StrokeSVGOptions`. Defaults to `console.warn`; pass a no-op to silence in production.
- `prefers-reduced-motion` support: `StrokeSVG` with `start: 'inViewport'` now checks `matchMedia` before creating the `IntersectionObserver`. If reduced motion is preferred, the SVG is instantly revealed (`seek(1)`) instead of waiting for viewport entry.
- Test coverage: added `StrokeSVG logger option` and `StrokeSVG prefers-reduced-motion with inViewport start` test suites.

---

## High priority

- ~~**Logging:** Consider an optional configurable logger instead of `console.warn` for invalid target or empty paths.~~ ✅ Done.

## Medium priority

- ~~**Accessibility:** Document or add `prefers-reduced-motion` support for ViewportObserver-triggered animations.~~ ✅ Done.

## Low priority

- **Docs:** Add integration examples with AnimCore/AnimReel (e.g. SVG icons in a scroll-driven hero or section) in README or a separate examples section.

