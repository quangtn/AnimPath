import PerfectScrollbar from 'perfect-scrollbar';

const INSTANCES = new Map<HTMLElement, PerfectScrollbar>();
const OBSERVERS = new Map<HTMLElement, MutationObserver>();
const SCROLL_SELECTOR =
  '.wizard-code, .library-results, #guide .guide-table-wrap, #guide .guide-code-block';

export function initPerfectScrollbars() {
  const elements = document.querySelectorAll<HTMLElement>(SCROLL_SELECTOR);

  elements.forEach((el) => {
    if (INSTANCES.has(el)) return;
    const instance = new PerfectScrollbar(el, {
      wheelPropagation: false,
      suppressScrollX: false,
      minScrollbarLength: 24,
    });
    INSTANCES.set(el, instance);

    const observer = new MutationObserver(() => {
      instance.update();
    });
    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    OBSERVERS.set(el, observer);
  });
}

export function refreshPerfectScrollbars() {
  INSTANCES.forEach((instance) => instance.update());
}
