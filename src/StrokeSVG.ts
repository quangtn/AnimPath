import type {
  StrokeSVGOptions,
  NormalizedStrokeSVGOptions,
  PathData,
} from './types';
import { getSVGElement } from './utils/dom';
import { parseSVG } from './parser/SVGParser';
import { getEasing } from './core/TimingFunctions';
import { computeSchedule } from './core/AnimationScheduler';
import { createAnimationEngine, resetPaths } from './core/AnimationEngine';
import { ViewportObserver } from './observers/ViewportObserver';
import { clamp } from './utils/math';

const DEFAULTS: NormalizedStrokeSVGOptions = {
  type: 'delayed',
  duration: 1500,
  easing: (t) => t,
  start: 'auto',
  delay: 0,
  staggerDelay: 50,
  direction: 'normal',
  renderMode: 'blank',
  outlineColor: '#9ca3af',
  outlineOpacity: 1,
  loop: false,
  convertShapes: true,
  viewportThreshold: 0.1,
  viewportRootMargin: '0px',
};

function normalizeOptions(options?: StrokeSVGOptions): NormalizedStrokeSVGOptions {
  const o = options ?? {};
  const easing =
    typeof o.easing === 'function'
      ? o.easing
      : getEasing((o.easing ?? 'linear') as Parameters<typeof getEasing>[0]);
  return {
    ...DEFAULTS,
    ...o,
    easing,
    onStart: o.onStart,
    onProgress: o.onProgress,
    onComplete: o.onComplete,
  };
}

export class StrokeSVG {
  private _svg: SVGSVGElement | null = null;
  private _options: NormalizedStrokeSVGOptions;
  private _schedules: ReturnType<typeof computeSchedule> = [];
  private _engine: ReturnType<typeof createAnimationEngine> | null = null;
  private _viewportUnobserve: (() => void) | null = null;
  private _finishedPromise: Promise<void>;
  private _finishResolve: (() => void) | null = null;
  private _destroyed = false;
  private _outlinePaths: SVGPathElement[] = [];

  constructor(
    target: string | SVGElement | HTMLElement,
    options?: StrokeSVGOptions
  ) {
    this._options = normalizeOptions(options);
    this._finishedPromise = new Promise((resolve) => {
      this._finishResolve = resolve;
    });

    const svg = getSVGElement(target);
    if (!svg || svg.tagName?.toLowerCase() !== 'svg') {
      console.warn('StrokeSVG: target is not a valid SVG element');
      this._finishResolve?.();
      return;
    }

    this._svg = svg as SVGSVGElement;
    const { paths } = parseSVG(this._svg, this._options.convertShapes);

    if (paths.length === 0) {
      console.warn('StrokeSVG: no drawable paths found in SVG');
      this._finishResolve?.();
      return;
    }

    this._schedules = computeSchedule(paths, {
      type: this._options.type,
      duration: this._options.duration,
      staggerDelay: this._options.staggerDelay,
      pathCount: paths.length,
    });

    this._engine = createAnimationEngine({
      schedules: this._schedules,
      duration: this._options.duration,
      easing: this._options.easing,
      direction: this._options.direction,
      callbacks: {
        onProgress: (p) => this._options.onProgress?.(p),
        onComplete: () => {
          this._options.onComplete?.();
          this._finishResolve?.();
          this._handleLoop();
        },
      },
    });

    if (this._options.renderMode === 'outline') {
      this._createOutlineLayer(paths);
    }

    resetPaths(this._schedules);

    if (this._options.start === 'inViewport') {
      this._setupViewportObserver();
    } else if (this._options.start === 'auto') {
      const delay = this._options.delay;
      if (delay > 0) {
        setTimeout(() => this.play(), delay);
      } else {
        this.play();
      }
    }
  }

  private _handleLoop(): void {
    if (this._destroyed || !this._engine) return;
    const loop = this._options.loop;
    if (loop === true) {
      this.reset().play();
    } else if (typeof loop === 'number' && loop > 1) {
      // Simplified: we'd need to track loop count. For now, loop=false.
    }
  }

  private _setupViewportObserver(): void {
    if (!this._svg) return;
    const obs = new ViewportObserver(
      this._svg,
      {
        threshold: this._options.viewportThreshold,
        rootMargin: this._options.viewportRootMargin,
      },
      () => this.play()
    );
    this._viewportUnobserve = () => obs.destroy();
  }

  play(): this {
    this._options.onStart?.();
    this._engine?.play();
    return this;
  }

  pause(): this {
    this._engine?.pause();
    return this;
  }

  reset(): this {
    this._engine?.reset();
    return this;
  }

  reverse(): this {
    this._engine?.reverse();
    return this;
  }

  seek(progress: number): this {
    this._engine?.seek(progress);
    return this;
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this._viewportUnobserve?.();
    this._engine?.destroy();
    for (const outline of this._outlinePaths) {
      outline.remove();
    }
    this._outlinePaths = [];
    this._engine = null;
    this._svg = null;
  }

  private _createOutlineLayer(paths: PathData[]): void {
    const outlineColor = this._options.outlineColor.trim();
    const outlineOpacity = Number.isFinite(this._options.outlineOpacity)
      ? clamp(this._options.outlineOpacity, 0, 1)
      : DEFAULTS.outlineOpacity;

    for (const path of paths) {
      const source = path.element;
      const parent = source.parentNode;
      if (!parent) continue;

      const outline = source.cloneNode(true) as SVGPathElement;
      outline.removeAttribute('id');
      outline.setAttribute('data-animpath-outline', '');
      outline.setAttribute('aria-hidden', 'true');
      outline.setAttribute('fill', 'none');
      outline.style.pointerEvents = 'none';
      outline.style.strokeDasharray = 'none';
      outline.style.strokeDashoffset = '0';
      outline.style.strokeOpacity = String(outlineOpacity);

      if (outlineColor !== '') {
        outline.setAttribute('stroke', outlineColor);
        outline.style.stroke = outlineColor;
      }

      parent.insertBefore(outline, source);
      this._outlinePaths.push(outline);
    }
  }

  /** Promise that resolves when the current animation completes */
  get finished(): Promise<void> {
    return this._finishedPromise;
  }

  /**
   * Create StrokeSVG from inline SVG string. Injects SVG into container and animates.
   */
  static fromString(
    svgMarkup: string,
    container: string | HTMLElement,
    options?: StrokeSVGOptions
  ): StrokeSVG | null {
    const el =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;
    if (!el) return null;

    const div = document.createElement('div');
    div.innerHTML = svgMarkup.trim();
    const svg = div.querySelector('svg');
    if (!svg) return null;

    el.appendChild(svg);
    return new StrokeSVG(svg, options);
  }
}
