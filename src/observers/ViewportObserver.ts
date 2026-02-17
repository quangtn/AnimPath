export interface ViewportObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
}

/**
 * Wrapper around IntersectionObserver to trigger a callback when element enters viewport.
 */
export class ViewportObserver {
  private _observer: IntersectionObserver | null = null;
  private _element: Element;
  private _callback: () => void;
  private _destroyed = false;

  constructor(
    element: Element,
    options: ViewportObserverOptions,
    callback: () => void
  ) {
    this._element = element;
    this._callback = callback;

    const threshold = options.threshold ?? 0.1;
    const rootMargin = options.rootMargin ?? '0px';
    const root = options.root ?? null;

    this._observer = new IntersectionObserver(
      (entries) => {
        if (this._destroyed) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this._callback();
            this._observer?.disconnect();
            this._observer = null;
            break;
          }
        }
      },
      { threshold, rootMargin, root }
    );

    this._observer.observe(this._element);
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this._observer?.disconnect();
    this._observer = null;
  }
}
