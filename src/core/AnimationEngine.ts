import type { PathSchedule } from '../types';
import type { EasingFunction } from '../types';
import { clamp } from '../utils/math';

export interface AnimationEngineCallbacks {
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export interface AnimationEngineOptions {
  schedules: PathSchedule[];
  duration: number;
  easing: EasingFunction;
  direction: 'normal' | 'reverse';
  callbacks?: AnimationEngineCallbacks;
}

/**
 * Initialize paths for animation: set stroke-dasharray and stroke-dashoffset.
 * @param easing - Optional easing function to apply to local progress (e.g. for seek)
 */
export function initPaths(
  schedules: PathSchedule[],
  progress: number = 0,
  easing?: (t: number) => number
): void {
  const ease = easing ?? ((t: number) => t);
  for (const s of schedules) {
    const { path, startProgress, durationProgress } = s;
    if (durationProgress <= 0) continue;

    const globalProgress = clamp(progress, 0, 1);
    const localT = (globalProgress - startProgress) / durationProgress;
    const localProgress = ease(clamp(localT, 0, 1));

    const len = path.length;
    path.element.style.strokeDasharray = String(len);
    path.element.style.strokeDashoffset = String(len * (1 - localProgress));
  }
}

/**
 * Reset all paths to initial (hidden) state.
 */
export function resetPaths(schedules: PathSchedule[]): void {
  initPaths(schedules, 0);
}

/**
 * Animate schedules using requestAnimationFrame.
 * Returns a controller with play, pause, reset, seek, destroy.
 */
export function createAnimationEngine(
  options: AnimationEngineOptions
): AnimationEngineController {
  const {
    schedules,
    duration,
    easing,
    direction,
    callbacks = {},
  } = options;

  const { onProgress, onComplete } = callbacks;
  let startTime: number | null = null;
  let accumulatedTime = 0;
  let isReverse = false;
  const _direction = direction;
  let destroyed = false;
  let rafId: number | null = null;

  function tick(timestamp: number): void {
    if (destroyed) return;

    if (startTime == null) {
      startTime = timestamp;
    }

    const elapsed = (timestamp - startTime) / 1000; // seconds
    const totalElapsed = elapsed + accumulatedTime;
    let rawProgress = totalElapsed / (duration / 1000); // 0-1 over duration
    rawProgress = clamp(rawProgress, 0, 1);

    if (isReverse) {
      rawProgress = 1 - rawProgress;
    }

    const progress = rawProgress;

    // Update each path
    for (const s of schedules) {
      const { path, startProgress, durationProgress } = s;
      if (durationProgress <= 0) continue;

      const globalProgress = clamp(progress, 0, 1);
      const localT = (globalProgress - startProgress) / durationProgress;
      const localProgress = clamp(localT, 0, 1);
      const eased = easing(localProgress);
      const effectiveProgress = _direction === 'reverse' ? 1 - eased : eased;

      const len = path.length;
      path.element.style.strokeDasharray = String(len);
      path.element.style.strokeDashoffset = String(len * (1 - effectiveProgress));
    }

    onProgress?.(progress);

    if (rawProgress >= 1 || rawProgress < 0 /** should check boundaries carefully handle reverse properly if looping, but simple for now */) {
      // if we are reverse and rawProgress <=0 ? 
      // Simplification: just normal forward completion for now unless direction handled better
      if (!isReverse && rawProgress >= 1) {
        rafId = null;
        accumulatedTime = duration / 1000;
        onComplete?.();
        return;
      }
      // If reverse, we might want to check <= 0, but original code didn't explicitly handle "finish reverse" other than stopping at start?
      // Original code just clamped.
      if (rawProgress >= 1) {
        rafId = null;
        onComplete?.();
        return;
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  function play(): void {
    if (destroyed) return;
    if (rafId != null) return; // already playing
    startTime = null;
    rafId = requestAnimationFrame(tick);
  }

  function pause(): void {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      // Capture elapsed time up to now
      // This is an approximation since we don't have the exact timestamp of 'now' relative to the frame
      // But we can assume performance.now() is close enough for the pause action
      if (startTime != null) {
        accumulatedTime += (performance.now() - startTime) / 1000;
        startTime = null;
      }
    }
  }

  function reset(): void {
    pause();
    startTime = null;
    accumulatedTime = 0;
    resetPaths(schedules);
  }

  function seek(progress: number): void {
    const p = clamp(progress, 0, 1);
    initPaths(schedules, p, easing);
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function reverse(): void {
    isReverse = !isReverse;
  }

  function destroy(): void {
    destroyed = true;
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  return {
    play,
    pause,
    reset,
    seek,
    reverse,
    destroy,
  };
}

export interface AnimationEngineController {
  play: () => void;
  pause: () => void;
  reset: () => void;
  seek: (progress: number) => void;
  reverse: () => void;
  destroy: () => void;
}
