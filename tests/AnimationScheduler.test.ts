import { describe, it, expect } from 'vitest';
import { computeSchedule } from '../src/core/AnimationScheduler';
import type { PathData } from '../src/types';

/** Create mock path data for testing */
function createMockPaths(count: number): PathData[] {
    return Array.from({ length: count }, (_, i) => ({
        element: {} as SVGPathElement,
        length: 100,
        originalTagName: 'path',
        index: i,
    }));
}

describe('AnimationScheduler - New Animation Types', () => {
    const duration = 1500;
    const staggerDelay = 50;

    describe('randomOrder', () => {
        it('schedules all paths with non-overlapping segments', () => {
            const paths = createMockPaths(5);
            const schedules = computeSchedule(paths, {
                type: 'randomOrder',
                duration,
                staggerDelay,
                pathCount: paths.length,
            });

            expect(schedules).toHaveLength(5);

            // Each path should have equal duration
            const segment = 1 / 5;
            schedules.forEach((s) => {
                expect(s.durationProgress).toBeCloseTo(segment, 5);
            });

            // All paths should be scheduled (check unique start times)
            const startTimes = schedules.map((s) => s.startProgress).sort((a, b) => a - b);
            for (let i = 0; i < startTimes.length - 1; i++) {
                expect(startTimes[i]).toBeLessThan(startTimes[i + 1]);
            }
        });

        it('produces different order than oneByOne', () => {
            const paths = createMockPaths(5);

            const randomSchedules = computeSchedule(paths, {
                type: 'randomOrder',
                duration,
                staggerDelay,
                pathCount: paths.length,
            });

            const oneByOneSchedules = computeSchedule(paths, {
                type: 'oneByOne',
                duration,
                staggerDelay,
                pathCount: paths.length,
            });

            // At least one path should have different start time
            let hasDifference = false;
            for (let i = 0; i < paths.length; i++) {
                if (Math.abs(randomSchedules[i].startProgress - oneByOneSchedules[i].startProgress) > 0.01) {
                    hasDifference = true;
                    break;
                }
            }
            expect(hasDifference).toBe(true);
        });
    });

    describe('fromCenter', () => {
        it('schedules center paths first', () => {
            const paths = createMockPaths(5);
            const schedules = computeSchedule(paths, {
                type: 'fromCenter',
                duration,
                staggerDelay,
                pathCount: paths.length,
            });

            expect(schedules).toHaveLength(5);

            // Center path (index 2) should have earliest start
            const centerSchedule = schedules[2];
            schedules.forEach((s, i) => {
                if (i !== 2) {
                    expect(s.startProgress).toBeGreaterThanOrEqual(centerSchedule.startProgress);
                }
            });

            // Outer paths (0, 4) should have latest start
            expect(schedules[0].startProgress).toBeGreaterThan(schedules[1].startProgress);
            expect(schedules[4].startProgress).toBeGreaterThan(schedules[3].startProgress);
        });

        it('schedules symmetrically around center', () => {
            const paths = createMockPaths(6);
            const schedules = computeSchedule(paths, {
                type: 'fromCenter',
                duration,
                staggerDelay,
                pathCount: paths.length,
            });

            // For even count, paths equidistant from center should start at same time
            expect(schedules[2].startProgress).toBeCloseTo(schedules[3].startProgress, 5);
            expect(schedules[1].startProgress).toBeCloseTo(schedules[4].startProgress, 5);
            expect(schedules[0].startProgress).toBeCloseTo(schedules[5].startProgress, 5);
        });
    });

    describe('converge', () => {
        it('schedules outer paths first', () => {
            const paths = createMockPaths(5);
            const schedules = computeSchedule(paths, {
                type: 'converge',
                duration,
                staggerDelay,
                pathCount: paths.length,
            });

            expect(schedules).toHaveLength(5);

            // Outer paths (0, 4) should have earliest start
            const centerSchedule = schedules[2];
            schedules.forEach((s, i) => {
                if (i !== 2) {
                    expect(s.startProgress).toBeLessThanOrEqual(centerSchedule.startProgress);
                }
            });

            // Center path should have latest start
            expect(centerSchedule.startProgress).toBeGreaterThan(schedules[0].startProgress);
            expect(centerSchedule.startProgress).toBeGreaterThan(schedules[4].startProgress);
        });

        it('is opposite of fromCenter', () => {
            const paths = createMockPaths(5);

            const fromCenterSchedules = computeSchedule(paths, {
                type: 'fromCenter',
                duration,
                staggerDelay,
                pathCount: paths.length,
            });

            const convergeSchedules = computeSchedule(paths, {
                type: 'converge',
                duration,
                staggerDelay,
                pathCount: paths.length,
            });

            // Center path should start latest in fromCenter, earliest in converge
            expect(fromCenterSchedules[2].startProgress).toBeLessThan(fromCenterSchedules[0].startProgress);
            expect(convergeSchedules[2].startProgress).toBeGreaterThan(convergeSchedules[0].startProgress);
        });
    });

    describe('wave', () => {
        it('follows sinusoidal pattern', () => {
            const paths = createMockPaths(5);
            const schedules = computeSchedule(paths, {
                type: 'wave',
                duration,
                staggerDelay,
                pathCount: paths.length,
            });

            expect(schedules).toHaveLength(5);

            // First and last paths should start early (sin(0) = 0, sin(π) = 0)
            expect(schedules[0].startProgress).toBeLessThan(schedules[2].startProgress);
            expect(schedules[4].startProgress).toBeLessThan(schedules[2].startProgress);

            // Middle path should start later (sin(π/2) = 1)
            const middleStart = schedules[2].startProgress;
            schedules.forEach((s) => {
                expect(s.startProgress).toBeLessThanOrEqual(middleStart + 0.01); // small epsilon for floating point
            });
        });

        it('creates smooth progression', () => {
            const paths = createMockPaths(10);
            const schedules = computeSchedule(paths, {
                type: 'wave',
                duration,
                staggerDelay: 100,
                pathCount: paths.length,
            });

            // Start times should follow smooth curve (no sudden jumps)
            const startTimes = schedules.map((s) => s.startProgress);
            for (let i = 1; i < startTimes.length - 1; i++) {
                const diff1 = Math.abs(startTimes[i] - startTimes[i - 1]);
                const diff2 = Math.abs(startTimes[i + 1] - startTimes[i]);
                // Adjacent differences shouldn't vary too wildly (within 3x)
                // Skip comparison if either difference is very small (< 0.001) to avoid division by zero
                if (diff1 > 0.001 && diff2 > 0.001) {
                    expect(Math.max(diff1, diff2) / Math.min(diff1, diff2)).toBeLessThan(3);
                }
            }
        });
    });

    describe('General schedule validation', () => {
        const types: Array<'randomOrder' | 'fromCenter' | 'converge' | 'wave'> = [
            'randomOrder',
            'fromCenter',
            'converge',
            'wave',
        ];

        types.forEach((type) => {
            describe(type, () => {
                it('produces valid progress values (0-1)', () => {
                    const paths = createMockPaths(5);
                    const schedules = computeSchedule(paths, {
                        type,
                        duration,
                        staggerDelay,
                        pathCount: paths.length,
                    });

                    schedules.forEach((s) => {
                        expect(s.startProgress).toBeGreaterThanOrEqual(0);
                        expect(s.startProgress).toBeLessThanOrEqual(1);
                        expect(s.endProgress).toBeGreaterThanOrEqual(0);
                        expect(s.endProgress).toBeLessThanOrEqual(1);
                        expect(s.endProgress).toBeGreaterThanOrEqual(s.startProgress);
                    });
                });

                it('returns correct number of schedules', () => {
                    const paths = createMockPaths(7);
                    const schedules = computeSchedule(paths, {
                        type,
                        duration,
                        staggerDelay,
                        pathCount: paths.length,
                    });

                    expect(schedules).toHaveLength(7);
                });

                it('handles single path', () => {
                    const paths = createMockPaths(1);
                    const schedules = computeSchedule(paths, {
                        type,
                        duration,
                        staggerDelay,
                        pathCount: paths.length,
                    });

                    expect(schedules).toHaveLength(1);
                    expect(schedules[0].startProgress).toBeGreaterThanOrEqual(0);
                    expect(schedules[0].endProgress).toBeLessThanOrEqual(1);
                });
            });
        });
    });
});
