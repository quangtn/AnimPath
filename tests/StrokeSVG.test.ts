import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
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

// ── Configurable Logger ────────────────────────────────────────────────────────

describe('StrokeSVG logger option', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calls custom logger.warn when target is not a valid SVG', () => {
    const logger = { warn: vi.fn() };
    const div = document.createElement('div');
    document.body.appendChild(div);

    new StrokeSVG(div as unknown as SVGElement, { start: 'manual', logger });

    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith('StrokeSVG: target is not a valid SVG element');
    div.remove();
  });

  it('calls custom logger.warn when SVG has no drawable paths', () => {
    const logger = { warn: vi.fn() };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    document.body.appendChild(svg);

    new StrokeSVG(svg, { start: 'manual', logger });

    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith('StrokeSVG: no drawable paths found in SVG');
    svg.remove();
  });

  it('does not call console.warn when a custom logger is provided', () => {
    const consoleSpy: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => { });
    const logger = { warn: vi.fn() };
    const div = document.createElement('div');
    document.body.appendChild(div);

    new StrokeSVG(div as unknown as SVGElement, { start: 'manual', logger });

    expect(consoleSpy).not.toHaveBeenCalled();
    div.remove();
  });
});

// ── prefers-reduced-motion + inViewport ───────────────────────────────────────

describe('StrokeSVG prefers-reduced-motion with inViewport start', () => {
  let svg: SVGSVGElement;

  function mockPathLength(path: SVGPathElement, length = 113.137) {
    path.getTotalLength = vi.fn(() => length) as unknown as () => number;
  }

  beforeEach(() => {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    svg.setAttribute('viewBox', '0 0 100 100');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
    path.setAttribute('d', 'M10 10 L90 90');
    path.setAttribute('stroke', 'black');
    path.setAttribute('fill', 'none');
    mockPathLength(path);
    svg.appendChild(path);
    document.body.appendChild(svg);
  });

  afterEach(() => {
    svg?.remove?.();
    vi.restoreAllMocks();
  });

  it('skips the IntersectionObserver and instantly reveals SVG when prefers-reduced-motion is set', () => {
    // jsdom has no IntersectionObserver — stub it so vi.spyOn can track calls
    const ioMock = vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() }))
    vi.stubGlobal('IntersectionObserver', ioMock)

    // Mock matchMedia to report reduced-motion
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));

    const instance = new StrokeSVG(svg, { start: 'inViewport' });

    // IntersectionObserver should NOT have been instantiated (reduced-motion bypasses it)
    expect(ioMock).not.toHaveBeenCalled();

    // finished promise should resolve (finishResolve was called)
    return expect(instance.finished).resolves.toBeUndefined();
  });

  it('still sets up IntersectionObserver when prefers-reduced-motion is not set', () => {
    // jsdom has no IntersectionObserver — stub it so ViewportObserver can construct
    const ioMock = vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() }))
    vi.stubGlobal('IntersectionObserver', ioMock)

    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));

    const instance = new StrokeSVG(svg, { start: 'inViewport' });

    // IntersectionObserver SHOULD have been instantiated
    expect(ioMock).toHaveBeenCalledOnce();
    expect(instance).toBeInstanceOf(StrokeSVG);
    instance.destroy();
  });
});

