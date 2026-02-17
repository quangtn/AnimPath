# Animpath v1.0.3

Injectable animated stroke-based SVG library. Draws SVG paths progressively using the `stroke-dasharray` / `stroke-dashoffset` technique.

Inspired by [Vivus](https://github.com/maxwellito/vivus), rebuilt with TypeScript, zero dependencies, and a modern API.

## Installation

```bash
npm install animpath
```

## Quick Start

```html
<svg id="my-logo" viewBox="0 0 100 100">
  <path d="M10 10 L90 90" stroke="black" fill="none" stroke-width="2"/>
</svg>

<script type="module">
  import { StrokeSVG } from 'animpath';

  const anim = new StrokeSVG('#my-logo', {
    type: 'delayed',
    duration: 1500,
    easing: 'easeInOut',
    start: 'auto',
  });
  anim.play();
</script>
```

## CDN (Script Tag)

```html
<script src="https://cdn.jsdelivr.net/npm/animpath@1.0.3/dist/animpath.umd.js"></script>
<script>
  const anim = new StrokeSVG('#my-svg', { duration: 1000 });
  anim.play();
</script>
```

## API

### `new StrokeSVG(target, options?)`

- **target**: `string` (selector), `SVGElement`, or `HTMLElement` containing an SVG
- **options**: See [Options](#options)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'delayed' \| 'sync' \| 'oneByOne' \| 'stagger' \| 'randomOrder' \| 'fromCenter' \| 'converge' \| 'wave'` | `'delayed'` | How paths are scheduled |
| `duration` | `number` | `1500` | Total animation duration (ms) |
| `easing` | `string \| (t: number) => number` | `'linear'` | Easing preset or custom function |
| `start` | `'auto' \| 'manual' \| 'inViewport'` | `'auto'` | When to start |
| `delay` | `number` | `0` | Initial delay (ms) |
| `staggerDelay` | `number` | `50` | Delay between path starts for delayed/stagger (ms) |
| `direction` | `'normal' \| 'reverse'` | `'normal'` | Draw direction |
| `renderMode` | `'blank' \| 'outline'` | `'blank'` | Initial visual mode before animation starts |
| `outlineColor` | `string` | `'#9ca3af'` | Stroke color for outline mode underlay |
| `outlineOpacity` | `number` | `1` | Opacity for outline mode underlay |
| `loop` | `boolean \| number` | `false` | Loop animation |
| `convertShapes` | `boolean` | `true` | Convert circle, rect, etc. to path |
| `onStart` | `() => void` | - | Callback when animation starts |
| `onProgress` | `(progress: number) => void` | - | Callback with progress 0-1 |
| `onComplete` | `() => void` | - | Callback when animation completes |

### Outline Mode

Show a full grayscale icon first, then draw the active stroke on top when animation starts:

```ts
new StrokeSVG('#my-icon', {
  start: 'manual',
  renderMode: 'outline',
  outlineColor: '#9ca3af', // default
  outlineOpacity: 1, // default
});
```

### Auto-Stroke Preparation

The library automatically ensures SVGs are ready for stroke animation:

- **Missing Stroke?** Inherits the `fill` color as the `stroke` color.
- **Missing Stroke Width?** Defaults to `stroke-width="2"`.
- **Filled Shape?** Sets `fill="none"` so the animation outline is visible.

This means you can drop in filled icons from popular libraries and they will animate correctly without manual changes:

- Lucide
- Heroicons
- Material Icons
- FontAwesome
- Iconify
- Ionicons
- Carbon
- Phosphor

### Animation Types

- **delayed** – Paths start with staggered delays, overlap
- **sync** – All paths animate together from start to finish
- **oneByOne** – Each path completes before the next begins
- **stagger** – Like delayed, with configurable `staggerDelay`
- **randomOrder** – Paths draw one-by-one in shuffled order (organic feel)
- **fromCenter** – Center paths draw first, expanding outward (great for logos)
- **converge** – Outer paths draw first, converging inward (framing effect)
- **wave** – Sinusoidal delay pattern creates rhythmic, flowing motion

### Easing Presets

`linear`, `easeIn`, `easeOut`, `easeInOut`, `easeInBack`, `easeOutBounce`, `easeOutElastic`

### Instance Methods

- `play()` – Start or resume animation
- `pause()` – Pause animation
- `reset()` – Reset to initial state
- `reverse()` – Toggle reverse direction
- `seek(progress)` – Jump to progress 0-1
- `destroy()` – Clean up observers and engine
- `finished` – Promise resolving when animation completes

### Static Methods

- **`StrokeSVG.fromString(svgMarkup, container, options?)`** – Inject SVG from string and animate
- **`scan(container?)`** – Auto-init all `[data-animpath]` elements

### Data Attribute Auto-Init

```html
<svg data-animpath data-animpath-options='{"type":"delayed","duration":1000}'>
  <path d="M0 0 L100 100" stroke="black" fill="none"/>
</svg>

<script type="module">
  import { scan } from 'animpath';
  scan(); // Initializes all matching SVGs
</script>
```

## Development

```bash
npm install
npm run build
npm run demo   # Dev server for demo page
npm test       # Run tests
```

## License

MIT
