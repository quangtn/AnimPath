import type { PathData, PathSchedule, AnimationType } from '../types';

export interface SchedulerOptions {
  type: AnimationType;
  duration: number; // ms
  staggerDelay: number; // ms
  pathCount: number;
}

/**
 * Compute per-path schedule (start/end progress 0-1) based on animation type.
 */
export function computeSchedule(
  paths: PathData[],
  options: SchedulerOptions
): PathSchedule[] {
  const { type, duration, staggerDelay, pathCount } = options;
  const n = pathCount || paths.length;
  if (n === 0) return [];

  const durationMs = Math.max(duration, 1);

  switch (type) {
    case 'sync':
      return paths.map((path) => ({
        path,
        startProgress: 0,
        endProgress: 1,
        durationProgress: 1,
      }));

    case 'oneByOne': {
      const segment = 1 / n;
      return paths.map((path, i) => ({
        path,
        startProgress: i * segment,
        endProgress: (i + 1) * segment,
        durationProgress: segment,
      }));
    }

    case 'delayed':
    case 'stagger': {
      const totalStagger = staggerDelay * (n - 1);
      const pathDuration = Math.max(durationMs - totalStagger, durationMs / n);
      const pathDurationProgress = pathDuration / durationMs;

      return paths.map((path, i) => {
        const startMs = staggerDelay * i;
        const startProgress = startMs / durationMs;
        const endProgress = Math.min(1, startProgress + pathDurationProgress);
        return {
          path,
          startProgress,
          endProgress,
          durationProgress: endProgress - startProgress,
        };
      });
    }

    case 'randomOrder': {
      // Shuffle path indices using Fisher-Yates algorithm with deterministic seed
      const shuffledIndices = [...Array(n).keys()];
      for (let i = n - 1; i > 0; i--) {
        // Simple deterministic shuffle based on path count (not cryptographically random, but visually random)
        const j = Math.floor(Math.abs(Math.sin(i * 12.9898 + n * 78.233) * 43758.5453)) % (i + 1);
        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
      }

      const segment = 1 / n;
      return paths.map((path) => {
        const shuffledIndex = shuffledIndices[path.index];
        return {
          path,
          startProgress: shuffledIndex * segment,
          endProgress: (shuffledIndex + 1) * segment,
          durationProgress: segment,
        };
      });
    }

    case 'fromCenter': {
      // Center paths start first, expanding outward
      const center = (n - 1) / 2;
      const totalStagger = staggerDelay * Math.ceil(n / 2);
      const pathDuration = Math.max(durationMs - totalStagger, durationMs / n);
      const pathDurationProgress = pathDuration / durationMs;

      return paths.map((path, i) => {
        const distanceFromCenter = Math.abs(i - center);
        const startMs = staggerDelay * distanceFromCenter;
        const startProgress = startMs / durationMs;
        const endProgress = Math.min(1, startProgress + pathDurationProgress);
        return {
          path,
          startProgress,
          endProgress,
          durationProgress: endProgress - startProgress,
        };
      });
    }

    case 'converge': {
      // Outer paths start first, converging inward
      const center = (n - 1) / 2;
      const totalStagger = staggerDelay * Math.ceil(n / 2);
      const pathDuration = Math.max(durationMs - totalStagger, durationMs / n);
      const pathDurationProgress = pathDuration / durationMs;

      return paths.map((path, i) => {
        const distanceFromCenter = Math.abs(i - center);
        const maxDistance = Math.max(center, n - 1 - center);
        const inverseDistance = maxDistance - distanceFromCenter;
        const startMs = staggerDelay * inverseDistance;
        const startProgress = startMs / durationMs;
        const endProgress = Math.min(1, startProgress + pathDurationProgress);
        return {
          path,
          startProgress,
          endProgress,
          durationProgress: endProgress - startProgress,
        };
      });
    }

    case 'wave': {
      // Sinusoidal wave pattern for start delays
      const totalStagger = staggerDelay * (n - 1);
      const pathDuration = Math.max(durationMs - totalStagger, durationMs / n);
      const pathDurationProgress = pathDuration / durationMs;

      return paths.map((path, i) => {
        // Sine wave from 0 to π creates smooth acceleration/deceleration
        // Handle single path edge case to avoid division by zero
        const waveProgress = n === 1 ? 0 : Math.sin((i / (n - 1)) * Math.PI);
        const startMs = waveProgress * totalStagger;
        const startProgress = startMs / durationMs;
        const endProgress = Math.min(1, startProgress + pathDurationProgress);
        return {
          path,
          startProgress,
          endProgress,
          durationProgress: endProgress - startProgress,
        };
      });
    }

    default:
      return paths.map((path) => ({
        path,
        startProgress: 0,
        endProgress: 1,
        durationProgress: 1,
      }));
  }
}
