import { StrokeSVG } from './StrokeSVG';
import type { StrokeSVGOptions } from './types';

const DATA_ATTR = 'data-animpath';
const DATA_ATTR_OPTIONS = 'data-animpath-options';

/**
 * Parse options from a data attribute. Accepts JSON string or empty string for defaults.
 */
function parseOptions(value: string | null): StrokeSVGOptions | undefined {
  if (value == null || value.trim() === '') return undefined;
  try {
    return JSON.parse(value) as StrokeSVGOptions;
  } catch {
    return undefined;
  }
}

/**
 * Scan the document (or a container) for elements with data-animpath
 * and initialize StrokeSVG on them.
 *
 * Usage: Add data-animpath to an SVG element. Optionally add data-animpath-options
 * with a JSON object for options.
 *
 * @example
 * <svg data-animpath data-animpath-options='{"type":"delayed","duration":1000}'>
 *
 * @param container - Optional root element or selector to scan within. Defaults to document.
 * @returns Array of StrokeSVG instances created
 */
export function scan(container?: Document | Element | string): StrokeSVG[] {
  const root =
    container == null
      ? document
      : typeof container === 'string'
        ? document.querySelector(container)
        : container;

  if (!root) return [];

  const elements = root.querySelectorAll(`[${DATA_ATTR}]`);
  const instances: StrokeSVG[] = [];

  for (const el of elements) {
    if (el.tagName?.toLowerCase() !== 'svg') continue;

    const optionsAttr = el.getAttribute(DATA_ATTR_OPTIONS);
    const options = parseOptions(optionsAttr ?? el.getAttribute(DATA_ATTR));

    try {
      const instance = new StrokeSVG(el as SVGElement, options);
      instances.push(instance);
    } catch (err) {
      console.warn('StrokeSVG auto-init failed for element:', el, err);
    }
  }

  return instances;
}
