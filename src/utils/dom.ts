/**
 * Resolve target to an Element.
 */
export function getElement(
  target: string | Element | null | undefined
): Element | null {
  if (target == null) return null;
  if (typeof target === 'string') {
    return document.querySelector(target);
  }
  return target;
}

/**
 * Resolve target to an SVGElement (SVG root).
 */
export function getSVGElement(
  target: string | SVGElement | HTMLElement | null | undefined
): SVGElement | null {
  const el = getElement(target);
  if (!el) return null;
  if (el instanceof SVGElement) {
    return el.tagName.toLowerCase() === 'svg' ? el : (el as SVGElement).ownerSVGElement ?? el as SVGElement;
  }
  const svg = el.querySelector('svg');
  return (svg ?? el) as SVGElement;
}

/**
 * Get numeric attribute with optional default.
 */
export function getNumericAttr(
  el: Element,
  name: string,
  defaultValue: number = 0
): number {
  const val = el.getAttribute(name);
  if (val == null || val === '') return defaultValue;
  const n = parseFloat(val);
  return Number.isNaN(n) ? defaultValue : n;
}
