import type { PathData } from '../types';
import { isDrawableShape, convertToPath } from './PathConverter';
import { createPathData } from './PathAnalyzer';

export interface ParseResult {
  paths: PathData[];
  root: SVGSVGElement;
}

/**
 * Ensure an SVG path element has proper stroke properties for stroke-dash animation.
 * If the element has no stroke, it inherits the fill color as stroke (or falls back to currentColor).
 * Fill is set to "none" so only the stroke outline is visible during animation.
 */
function preparePath(el: SVGPathElement): void {
  const computed = (el.ownerSVGElement?.ownerDocument?.defaultView ?? window).getComputedStyle(el);

  // Determine if the element has meaningful stroke already
  const rawStroke = el.getAttribute('stroke');
  const computedStroke = computed.stroke;
  const hasStroke =
    rawStroke != null && rawStroke !== '' && rawStroke !== 'none' ||
    computedStroke != null && computedStroke !== '' && computedStroke !== 'none';

  if (!hasStroke) {
    // Inherit stroke from the existing fill, or fall back to currentColor
    const rawFill = el.getAttribute('fill');
    const computedFill = computed.fill;

    if (rawFill && rawFill !== 'none' && rawFill !== '') {
      el.setAttribute('stroke', rawFill);
    } else if (computedFill && computedFill !== 'none' && computedFill !== 'rgb(0, 0, 0)') {
      el.setAttribute('stroke', computedFill);
    } else {
      el.setAttribute('stroke', 'currentColor');
    }
  }

  // Ensure stroke-width exists (default to 2 if missing/zero)
  const rawStrokeWidth = el.getAttribute('stroke-width');
  const computedWidth = parseFloat(computed.strokeWidth || '0');
  if ((!rawStrokeWidth || rawStrokeWidth === '0') && (computedWidth <= 0)) {
    el.setAttribute('stroke-width', '2');
  }

  // Set fill to none so stroke-dash animation is visible
  el.setAttribute('fill', 'none');
}

/**
 * Parse an SVG element, optionally converting non-path shapes to paths,
 * and collect all drawable paths with their lengths.
 */
export function parseSVG(
  svg: SVGSVGElement,
  convertShapes: boolean = true
): ParseResult {
  const paths: PathData[] = [];
  let index = 0;

  function walk(node: Node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;

    if (isDrawableShape(el)) {
      let pathEl: SVGPathElement;
      const tag = el.tagName.toLowerCase();

      if (tag === 'path') {
        pathEl = el as SVGPathElement;
      } else if (convertShapes) {
        pathEl = convertToPath(el as SVGElement);
      } else {
        return; // Skip non-path shapes when not converting
      }

      preparePath(pathEl);

      const pathData = createPathData(pathEl, index, tag);
      if (pathData.length > 0) {
        paths.push(pathData);
        index++;
      }
      return;
    }

    for (let i = 0; i < el.childNodes.length; i++) {
      walk(el.childNodes[i]);
    }
  }

  walk(svg);

  return { paths, root: svg };
}
