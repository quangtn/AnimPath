# AnimPath — Next Steps

Prioritized recommendations for improving AnimPath (stroke-based SVG animation library).

---

## High priority

- **Logging:** Consider an optional configurable logger instead of `console.warn` for invalid target or empty paths (e.g. in `StrokeSVG` constructor). Allows production builds to suppress or redirect warnings.

## Medium priority

- **Accessibility:** Document or add `prefers-reduced-motion` support for ViewportObserver-triggered animations (`start: 'inViewport'`). When reduced motion is preferred, consider skipping auto-start or using instant reveal. See `src/observers/ViewportObserver.ts` and `src/StrokeSVG.ts`.

## Low priority

- **Docs:** Add integration examples with AnimCore/AnimReel (e.g. SVG icons in a scroll-driven hero or section) in README or a separate examples section.
