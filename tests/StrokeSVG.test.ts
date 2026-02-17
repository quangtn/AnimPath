import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StrokeSVG, scan } from '../src/index';

/** jsdom does not implement getTotalLength; add a mock for tests */
function mockPathLength(path: SVGPathElement, length = 113.137) {
  path.getTotalLength = vi.fn(() => length) as unknown as () => number;
}

function createTestSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  path.setAttribute('d', 'M10 10 L90 90');
  path.setAttribute('stroke', 'black');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');

  mockPathLength(path);

  svg.appendChild(path);
  document.body.appendChild(svg);
  return svg;
}

describe('StrokeSVG', () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    svg = createTestSVG() as SVGSVGElement;
  });

  afterEach(() => {
    svg?.remove?.();
    vi.restoreAllMocks();
  });

  it('instantiates with selector', () => {
    svg.id = 'test-svg-1';
    const instance = new StrokeSVG('#test-svg-1', { start: 'manual' });
    expect(instance).toBeInstanceOf(StrokeSVG);
    instance.destroy();
  });

  it('instantiates with element', () => {
    const instance = new StrokeSVG(svg, { start: 'manual' });
    expect(instance).toBeInstanceOf(StrokeSVG);
    instance.destroy();
  });

  it('play, pause, reset are chainable', () => {
    const instance = new StrokeSVG(svg, { start: 'manual' });
    expect(instance.play()).toBe(instance);
    expect(instance.pause()).toBe(instance);
    expect(instance.reset()).toBe(instance);
    instance.destroy();
  });

  it('seek accepts 0-1 progress', () => {
    const instance = new StrokeSVG(svg, { start: 'manual' });
    expect(instance.seek(0.5)).toBe(instance);
    instance.destroy();
  });

  it('fromString creates instance from markup', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const markup = '<svg viewBox="0 0 100 100"><path d="M0 0 L100 100" stroke="black" fill="none"/></svg>';
    const instance = StrokeSVG.fromString(markup, container, { start: 'manual' });

    expect(instance).toBeInstanceOf(StrokeSVG);
    expect(container.querySelector('svg')).toBeTruthy();

    instance?.destroy?.();
    container.remove();
  });

  it('supports outline render mode with visible underlay before play', () => {
    const instance = new StrokeSVG(svg, {
      start: 'manual',
      renderMode: 'outline',
    });

    const paths = svg.querySelectorAll('path');
    expect(paths.length).toBe(2);

    const outlinePath = paths[0] as SVGPathElement;
    const animatedPath = paths[1] as SVGPathElement;

    expect(outlinePath.hasAttribute('data-animpath-outline')).toBe(true);
    expect(outlinePath.getAttribute('stroke')).toBe('#9ca3af');
    expect(outlinePath.style.strokeDashoffset).toBe('0');
    expect(outlinePath.style.strokeOpacity).toBe('1');
    expect(animatedPath.style.strokeDashoffset).toBe('113.137');

    instance.destroy();
    expect(svg.querySelectorAll('path').length).toBe(1);
  });

  it('applies custom outline color and opacity in outline mode', () => {
    const instance = new StrokeSVG(svg, {
      start: 'manual',
      renderMode: 'outline',
      outlineColor: 'rgb(120, 120, 120)',
      outlineOpacity: 0.6,
    });

    const outlinePath = svg.querySelector(
      'path[data-animpath-outline]'
    ) as SVGPathElement | null;
    expect(outlinePath).toBeTruthy();
    expect(outlinePath?.getAttribute('stroke')).toBe('rgb(120, 120, 120)');
    expect(outlinePath?.style.strokeOpacity).toBe('0.6');

    instance.destroy();
  });
});

describe('scan', () => {
  afterEach(() => {
    document.body.querySelectorAll('[data-animpath]').forEach((el) => el.remove());
    vi.restoreAllMocks();
  });

  it('finds and initializes SVG elements with data-animpath', () => {
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('data-animpath', '');
    svgEl.setAttribute('viewBox', '0 0 100 100');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
    path.setAttribute('d', 'M0 0 L100 100');
    path.setAttribute('stroke', 'black');
    path.setAttribute('fill', 'none');
    mockPathLength(path);
    svgEl.appendChild(path);
    document.body.appendChild(svgEl);

    const instances = scan();
    expect(instances.length).toBeGreaterThanOrEqual(1);
    instances.forEach((i) => i.destroy());
  });
});
