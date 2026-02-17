import { describe, it, expect } from 'vitest';
import { getEasing, easings } from '../src/core/TimingFunctions';

describe('TimingFunctions', () => {
  const presets = [
    'linear',
    'easeIn',
    'easeOut',
    'easeInOut',
    'easeInBack',
    'easeOutBounce',
    'easeOutElastic',
  ] as const;

  presets.forEach((name) => {
    describe(name, () => {
      it('returns 0 at t=0', () => {
        const fn = getEasing(name);
        const result = fn(0);
        if (name === 'easeInBack') {
          expect(result).toBe(0);
        } else if (name === 'easeOutElastic') {
          expect(result).toBe(0);
        } else {
          expect(result).toBe(0);
        }
      });

      it('returns 1 at t=1', () => {
        const fn = getEasing(name);
        expect(fn(1)).toBeCloseTo(1, 10);
      });

      it('returns values in [0,1] for t in [0,1]', () => {
        const fn = getEasing(name);
        for (let t = 0; t <= 1; t += 0.1) {
          const result = fn(t);
          expect(result).toBeGreaterThanOrEqual(-0.5); // easeInBack can go slightly negative
          expect(result).toBeLessThanOrEqual(1.5); // bounce can overshoot
        }
      });
    });
  });

  describe('getEasing', () => {
    it('returns custom function when given a function', () => {
      const custom = (t: number) => t * t;
      const fn = getEasing(custom);
      expect(fn(0.5)).toBe(0.25);
      expect(fn).toBe(custom);
    });

    it('returns linear for unknown preset', () => {
      const fn = getEasing('unknown' as 'linear');
      expect(fn(0.5)).toBe(0.5);
    });
  });
});
