/**
 * Animation type determines how paths are scheduled relative to each other.
 */
export type AnimationType = 'delayed' | 'sync' | 'oneByOne' | 'stagger' | 'randomOrder' | 'fromCenter' | 'converge' | 'wave';

/**
 * When the animation should start.
 */
export type StartMode = 'auto' | 'manual' | 'inViewport';

/**
 * Animation direction.
 */
export type Direction = 'normal' | 'reverse';

/**
 * Initial visual mode before/while animating.
 */
export type RenderMode = 'blank' | 'outline';

/**
 * Built-in easing preset names.
 */
export type EasingPreset =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInBack'
  | 'easeOutBounce'
  | 'easeOutElastic';

/**
 * Custom easing function. Accepts progress 0-1, returns eased value 0-1.
 */
export type EasingFunction = (t: number) => number;

/**
 * Metadata for a single animatable path within an SVG.
 */
export interface PathData {
  /** The path element (SVGPathElement or converted path) */
  element: SVGPathElement;
  /** Total length of the path in user units */
  length: number;
  /** Original element tag name (before conversion) */
  originalTagName: string;
  /** Index in the flattened path list */
  index: number;
}

/**
 * Schedule for a single path - when it starts and ends during the animation.
 */
export interface PathSchedule {
  path: PathData;
  /** Start time as fraction of total duration (0-1) */
  startProgress: number;
  /** End time as fraction of total duration (0-1) */
  endProgress: number;
  /** Duration as fraction of total (0-1) */
  durationProgress: number;
}

/**
 * Options for the StrokeSVG animation.
 */
export interface StrokeSVGOptions {
  /** Animation type - how paths are staggered */
  type?: AnimationType;
  /** Total animation duration in milliseconds */
  duration?: number;
  /** Easing preset name or custom function */
  easing?: EasingPreset | EasingFunction;
  /** When to start: auto = immediately, manual = wait for play(), inViewport = when visible */
  start?: StartMode;
  /** Initial delay before animation starts (ms) */
  delay?: number;
  /** For stagger/delayed: delay between path starts (ms) */
  staggerDelay?: number;
  /** Animation direction */
  direction?: Direction;
  /** Initial visual mode before animation starts */
  renderMode?: RenderMode;
  /** Outline stroke color used when renderMode = "outline" */
  outlineColor?: string;
  /** Outline opacity used when renderMode = "outline" */
  outlineOpacity?: number;
  /** Loop: false = once, true = infinite, number = N times */
  loop?: boolean | number;
  /** Convert non-path shapes (circle, rect, etc.) to path. Default true. */
  convertShapes?: boolean;
  /** Threshold for inViewport (0-1). Default 0.1. */
  viewportThreshold?: number;
  /** Root margin for IntersectionObserver when start=inViewport */
  viewportRootMargin?: string;
  /** Callback when animation starts */
  onStart?: () => void;
  /** Callback with overall progress 0-1 during animation */
  onProgress?: (progress: number) => void;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Internal normalized options with defaults applied.
 */
export interface NormalizedStrokeSVGOptions extends Required<Omit<StrokeSVGOptions, 'easing' | 'onStart' | 'onProgress' | 'onComplete'>> {
  easing: EasingFunction;
  onStart?: () => void;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}
