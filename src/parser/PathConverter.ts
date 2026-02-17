import { getNumericAttr } from '../utils/dom';

const DRAWABLE_TAGS = ['path', 'line', 'rect', 'circle', 'ellipse', 'polyline', 'polygon'] as const;

export type DrawableTag = (typeof DRAWABLE_TAGS)[number];

/**
 * Check if an element is a drawable SVG shape that can be converted to path.
 */
export function isDrawableShape(el: Element): el is SVGGeometryElement {
  const tag = el.tagName.toLowerCase();
  return DRAWABLE_TAGS.includes(tag as DrawableTag);
}

/**
 * Convert a non-path SVG element to an equivalent path element.
 * Preserves attributes (fill, stroke, transform, etc.).
 * Returns the original element if it's already a path.
 */
export function convertToPath(el: SVGElement): SVGPathElement {
  const tag = el.tagName.toLowerCase();

  if (tag === 'path') {
    return el as SVGPathElement;
  }

  const svgNs = 'http://www.w3.org/2000/svg';
  const pathEl = document.createElementNS(svgNs, 'path') as SVGPathElement;

  // Copy attributes (except d for path, and element-specific attrs)
  const skipAttrs = new Set(['d', 'x1', 'y1', 'x2', 'y2', 'x', 'y', 'width', 'height', 'rx', 'ry', 'r', 'cx', 'cy', 'points']);
  for (const attr of Array.from(el.attributes)) {
    if (!skipAttrs.has(attr.name.toLowerCase())) {
      pathEl.setAttribute(attr.name, attr.value);
    }
  }

  const d = elementToPathData(el);
  if (d) {
    pathEl.setAttribute('d', d);
  }

  // Replace element in DOM
  if (el.parentNode) {
    el.parentNode.insertBefore(pathEl, el);
    el.parentNode.removeChild(el);
  }

  return pathEl;
}

function elementToPathData(el: SVGElement): string {
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case 'line':
      return lineToPath(el as SVGLineElement);
    case 'rect':
      return rectToPath(el as SVGRectElement);
    case 'circle':
      return circleToPath(el as SVGCircleElement);
    case 'ellipse':
      return ellipseToPath(el as SVGEllipseElement);
    case 'polyline':
      return polylineToPath(el as SVGPolylineElement);
    case 'polygon':
      return polygonToPath(el as SVGPolygonElement);
    case 'path':
      return (el as SVGPathElement).getAttribute('d') ?? '';
    default:
      return '';
  }
}

function lineToPath(line: SVGLineElement): string {
  const x1 = getNumericAttr(line, 'x1', 0);
  const y1 = getNumericAttr(line, 'y1', 0);
  const x2 = getNumericAttr(line, 'x2', 0);
  const y2 = getNumericAttr(line, 'y2', 0);
  return `M ${x1},${y1} L ${x2},${y2}`;
}

function rectToPath(rect: SVGRectElement): string {
  const x = getNumericAttr(rect, 'x', 0);
  const y = getNumericAttr(rect, 'y', 0);
  const w = getNumericAttr(rect, 'width', 0);
  const h = getNumericAttr(rect, 'height', 0);
  const rx = getNumericAttr(rect, 'rx', 0);
  const ry = getNumericAttr(rect, 'ry', rx);

  if (rx <= 0 && ry <= 0) {
    return `M ${x},${y} h ${w} v ${h} h ${-w} Z`;
  }

  const rx2 = Math.min(rx, w / 2);
  const ry2 = Math.min(ry, h / 2);
  return (
    `M ${x + rx2},${y}` +
    ` L ${x + w - rx2},${y}` +
    ` Q ${x + w},${y} ${x + w},${y + ry2}` +
    ` L ${x + w},${y + h - ry2}` +
    ` Q ${x + w},${y + h} ${x + w - rx2},${y + h}` +
    ` L ${x + rx2},${y + h}` +
    ` Q ${x},${y + h} ${x},${y + h - ry2}` +
    ` L ${x},${y + ry2}` +
    ` Q ${x},${y} ${x + rx2},${y} Z`
  );
}

function circleToPath(circle: SVGCircleElement): string {
  const cx = getNumericAttr(circle, 'cx', 0);
  const cy = getNumericAttr(circle, 'cy', 0);
  const r = getNumericAttr(circle, 'r', 0);
  if (r <= 0) return '';
  // Two semicircle arcs
  return `M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy} A ${r},${r} 0 0 1 ${cx - r},${cy} Z`;
}

function ellipseToPath(ellipse: SVGEllipseElement): string {
  const cx = getNumericAttr(ellipse, 'cx', 0);
  const cy = getNumericAttr(ellipse, 'cy', 0);
  const rx = getNumericAttr(ellipse, 'rx', 0);
  const ry = getNumericAttr(ellipse, 'ry', 0);
  if (rx <= 0 || ry <= 0) return '';
  return `M ${cx - rx},${cy} A ${rx},${ry} 0 0 1 ${cx + rx},${cy} A ${rx},${ry} 0 0 1 ${cx - rx},${cy} Z`;
}

function polylineToPath(poly: SVGPolylineElement): string {
  const points = poly.points;
  if (!points || points.numberOfItems === 0) return '';
  const parts: string[] = [];
  for (let i = 0; i < points.numberOfItems; i++) {
    const p = points.getItem(i);
    parts.push(`${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`);
  }
  return parts.join(' ');
}

function polygonToPath(poly: SVGPolygonElement): string {
  const d = polylineToPath(poly as unknown as SVGPolylineElement);
  return d ? `${d} Z` : d;
}
