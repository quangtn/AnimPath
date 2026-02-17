import { describe, it, expect, beforeEach } from 'vitest';
import { convertToPath, isDrawableShape } from '../src/parser/PathConverter';

function setupDOM() {
  const div = document.createElement('div');
  document.body.appendChild(div);
  return div;
}

describe('PathConverter', () => {
  describe('isDrawableShape', () => {
    it('returns true for path, line, rect, circle, ellipse, polyline, polygon', () => {
      const tags = ['path', 'line', 'rect', 'circle', 'ellipse', 'polyline', 'polygon'];
      tags.forEach((tag) => {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        expect(isDrawableShape(el)).toBe(true);
      });
    });

    it('returns false for non-drawable elements', () => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      expect(isDrawableShape(el)).toBe(false);
    });
  });

  describe('convertToPath', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = setupDOM();
    });

    it('converts line to path', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', '100');
      line.setAttribute('y2', '50');
      svg.appendChild(line);
      container.appendChild(svg);

      const path = convertToPath(line);
      expect(path.tagName.toLowerCase()).toBe('path');
      expect(path.getAttribute('d')).toBe('M 0,0 L 100,50');
    });

    it('converts rect to path', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '10');
      rect.setAttribute('y', '20');
      rect.setAttribute('width', '30');
      rect.setAttribute('height', '40');
      svg.appendChild(rect);
      container.appendChild(svg);

      const path = convertToPath(rect);
      expect(path.tagName.toLowerCase()).toBe('path');
      expect(path.getAttribute('d')).toBe('M 10,20 h 30 v 40 h -30 Z');
    });

    it('converts circle to path', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '50');
      circle.setAttribute('r', '25');
      svg.appendChild(circle);
      container.appendChild(svg);

      const path = convertToPath(circle);
      expect(path.tagName.toLowerCase()).toBe('path');
      const d = path.getAttribute('d') ?? '';
      expect(d).toContain('A 25,25');
      expect(d).toContain('M 25,50');
    });

    it('returns path unchanged', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', 'M 0 0 L 100 100');
      svg.appendChild(pathEl);
      container.appendChild(svg);

      const result = convertToPath(pathEl);
      expect(result).toBe(pathEl);
      expect(result.getAttribute('d')).toBe('M 0 0 L 100 100');
    });
  });
});
