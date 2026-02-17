import type { PathData } from '../types';

/**
 * Extract path length from an SVGPathElement.
 */
export function getPathLength(path: SVGPathElement): number {
  try {
    return path.getTotalLength();
  } catch {
    return 0;
  }
}

/**
 * Build PathData for a single path element.
 */
export function createPathData(
  element: SVGPathElement,
  index: number,
  originalTagName: string = 'path'
): PathData {
  const length = getPathLength(element);
  return {
    element,
    length,
    originalTagName,
    index,
  };
}
