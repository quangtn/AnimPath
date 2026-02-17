import type { EasingPreset, EasingFunction } from '../types';

const easings: Record<EasingPreset, EasingFunction> = {
  linear: (t) => t,

  easeIn: (t) => t * t,

  easeOut: (t) => t * (2 - t),

  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },

  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },

  easeOutElastic: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * Resolve easing to a function. Accepts preset name or custom function.
 */
export function getEasing(easing: EasingPreset | EasingFunction): EasingFunction {
  if (typeof easing === 'function') return easing;
  return easings[easing] ?? easings.linear;
}

export { easings };
