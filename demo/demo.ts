import { StrokeSVG } from '../src/index';
import 'highlight.js/styles/github-dark.css';
import 'perfect-scrollbar/css/perfect-scrollbar.css';
// @ts-ignore
import {
  createIcons,
  Play,
  Pause,
  Infinity,
  Square,
  Zap,
  LayoutGrid,
  Wand2,
  Search,
  Folders,
  Book,
  Upload,
  PanelLeft,
} from 'lucide';
import { Wizard } from './wizard';
import { Library } from './library';
import { highlightGuideCodeBlocks } from './guideHighlighter';
import {
  initPerfectScrollbars,
  refreshPerfectScrollbars,
} from './scrollManager';

// Sample SVGs with multiple paths for animation
const commonSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chrome"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" x2="12" y1="8" y2="8"/><line x1="3.95" x2="8.54" y1="6.06" y2="14"/><line x1="10.88" x2="15.46" y1="21.94" y2="14"/></svg>`;

const sampleSVGs = [
  {
    title: 'One By One',
    type: 'oneByOne' as const,
    svg: commonSVG,
    description: 'Each path completes before the next begins',
  },
  {
    title: 'Delayed',
    type: 'delayed' as const,
    svg: commonSVG,
    description: 'Paths start with staggered delays and overlap',
  },
  {
    title: 'Sync',
    type: 'sync' as const,
    svg: commonSVG,
    description: 'All paths animate together simultaneously',
  },
  {
    title: 'Stagger',
    type: 'stagger' as const,
    svg: commonSVG,
    description: 'Like delayed with configurable delay timing',
  },
  {
    title: 'Random Order',
    type: 'randomOrder' as const,
    svg: commonSVG,
    description: 'Paths draw in shuffled order for organic feel',
  },
  {
    title: 'From Center',
    type: 'fromCenter' as const,
    svg: commonSVG,
    description: 'Center paths animate first, expanding outward',
  },
  {
    title: 'Converge',
    type: 'converge' as const,
    svg: commonSVG,
    description: 'Outer paths converge inward to center',
  },
  {
    title: 'Wave',
    type: 'wave' as const,
    svg: commonSVG,
    description: 'Sinusoidal delay pattern creates flowing motion',
  },
];

const allInstances: StrokeSVG[] = [];
let effectsIsPlaying = false;
let effectsAutorunEnabled = false;
let effectsPlayButton: HTMLButtonElement | null = null;
let effectsAutorunButton: HTMLButtonElement | null = null;
let landingHeroInstance: StrokeSVG | null = null;
const dashboardInstances: StrokeSVG[] = [];
const docsIconInstances: StrokeSVG[] = [];
const pricingIconInstances: Partial<
  Record<'starter' | 'pro' | 'enterprise', StrokeSVG>
> = {};
let pricingTabsInitialized = false;

function registerLucideIcons() {
  createIcons({
    icons: {
      Play,
      Pause,
      Infinity,
      Square,
      Zap,
      LayoutGrid,
      Wand2,
      Search,
      Folders,
      Book,
      Upload,
      PanelLeft,
    },
  });
}

function renderExamples() {
  const root = document.getElementById('examples-root');
  if (!root) return;

  root.innerHTML = '';
  effectsIsPlaying = false;
  allInstances.length = 0;

  // 1. Grid Container
  const grid = document.createElement('div');
  grid.className = 'examples-grid';

  // 2. Render Items
  sampleSVGs.forEach((sample) => {
    const item = document.createElement('div');
    item.className = 'example-item';

    // Add description tooltip
    const desc = document.createElement('div');
    desc.className = 'example-description';
    desc.textContent = sample.description;
    item.appendChild(desc);

    const h3 = document.createElement('h3');
    h3.textContent = sample.title; // e.g. "One By One"
    item.appendChild(h3);

    const preview = document.createElement('div');
    preview.className = 'example-preview';
    preview.innerHTML = sample.svg.trim();
    item.appendChild(preview);

    const svg = preview.querySelector('svg');
    if (svg) {
      const instance = new StrokeSVG(svg, {
        type: sample.type,
        duration: 1500,
        easing: 'easeInOut',
        loop: effectsAutorunEnabled,
        start: 'manual',
        onStart: () => {
          effectsIsPlaying = true;
          refreshEffectsPlayButton();
        },
        onComplete: () => {
          if (!effectsAutorunEnabled) {
            effectsIsPlaying = false;
            refreshEffectsPlayButton();
          }
        },
      });
      if (instance) {
        if (!effectsAutorunEnabled) {
          instance.seek(1);
        }
        allInstances.push(instance);
      }
    }

    grid.appendChild(item);
  });

  root.appendChild(grid);

  // 3. Global Control Bar
  const controls = document.createElement('div');
  controls.className = 'examples-controls';

  effectsPlayButton = createToggleControlBtn('play', 'pause', 'Play', () => {
    if (effectsIsPlaying) {
      allInstances.forEach((instance) => instance.pause());
      effectsIsPlaying = false;
      refreshEffectsPlayButton();
      return;
    }

    allInstances.forEach((instance) => instance.reset());
    allInstances.forEach((instance) => instance.play());
  });

  effectsAutorunButton = createToggleControlBtn(
    'infinity',
    'square',
    'Autorun',
    () => {
      effectsAutorunEnabled = !effectsAutorunEnabled;
      refreshEffectsAutorunButton();
      renderExamples();

      if (effectsAutorunEnabled) {
        allInstances.forEach((instance) => instance.play());
      }
    }
  );

  refreshEffectsPlayButton();
  refreshEffectsAutorunButton();

  if (effectsPlayButton) {
    controls.append(effectsPlayButton);
  }
  if (effectsAutorunButton) {
    controls.append(effectsAutorunButton);
  }

  root.appendChild(controls);
  registerLucideIcons();
}

function createToggleControlBtn(
  primaryIconName: string,
  alternateIconName: string,
  label: string,
  onClick: () => void
) {
  const btn = document.createElement('button');
  btn.className = 'control-btn';
  btn.onclick = onClick;

  const iconPrimary = document.createElement('i');
  iconPrimary.className = 'icon-primary';
  iconPrimary.setAttribute('data-lucide', primaryIconName);

  const iconAlternate = document.createElement('i');
  iconAlternate.className = 'icon-alternate';
  iconAlternate.setAttribute('data-lucide', alternateIconName);
  iconAlternate.style.display = 'none';

  const span = document.createElement('span');
  span.textContent = label;

  btn.append(iconPrimary, iconAlternate, span);
  return btn;
}

function refreshEffectsPlayButton() {
  if (!effectsPlayButton) return;
  const primary = effectsPlayButton.querySelector(
    '.icon-primary'
  ) as HTMLElement;
  const alternate = effectsPlayButton.querySelector(
    '.icon-alternate'
  ) as HTMLElement;
  const label = effectsPlayButton.querySelector('span');

  if (effectsIsPlaying) {
    primary.style.display = 'none';
    alternate.style.display = '';
    if (label) label.textContent = 'Pause';
  } else {
    primary.style.display = '';
    alternate.style.display = 'none';
    if (label) label.textContent = 'Play';
  }
}

function refreshEffectsAutorunButton() {
  if (!effectsAutorunButton) return;
  const primary = effectsAutorunButton.querySelector(
    '.icon-primary'
  ) as HTMLElement;
  const alternate = effectsAutorunButton.querySelector(
    '.icon-alternate'
  ) as HTMLElement;
  const label = effectsAutorunButton.querySelector('span');

  if (effectsAutorunEnabled) {
    primary.style.display = 'none';
    alternate.style.display = '';
    if (label) label.textContent = 'Stop Autorun';
  } else {
    primary.style.display = '';
    alternate.style.display = 'none';
    if (label) label.textContent = 'Autorun';
  }
}

function createControlBtn(
  iconName: string,
  label: string,
  onClick: () => void
) {
  const btn = document.createElement('button');
  btn.className = 'control-btn';
  btn.onclick = onClick;

  // Icon
  const i = document.createElement('i');
  i.setAttribute('data-lucide', iconName);
  btn.appendChild(i);

  // Label
  const span = document.createElement('span');
  span.textContent = label;
  btn.appendChild(span);

  return btn;
}

// Initial Render
renderExamples();

// Initialize Wizard
new Wizard('wizard-root');
new Library('library-root');
highlightGuideCodeBlocks();
initPricingTabs();
initPerfectScrollbars();
refreshPerfectScrollbars();

// Navigation Logic
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const appLayout = document.querySelector('.app-layout') as HTMLElement | null;
const sidebarToggle = document.getElementById(
  'sidebar-toggle'
) as HTMLButtonElement | null;
const SIDEBAR_COLLAPSE_STORAGE_KEY = 'animpath.sidebarCollapsed';
const SECTION_TO_PATH: Record<string, string> = {
  gallery: '/effects',
  wizard: '/wizard',
  library: '/library',
  examples: '/examples',
  'example-landing': '/examples/landing-page',
  'example-dashboard': '/examples/dashboard',
  'example-pricing': '/examples/pricing',
  'example-docs': '/examples/docs',
  guide: '/guide',
};
const PATH_TO_SECTION: Record<string, string> = Object.fromEntries(
  Object.entries(SECTION_TO_PATH).map(([sectionId, path]) => [path, sectionId])
);

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function resolveSectionFromPath(pathname: string): string {
  const normalizedPath = normalizePath(pathname);
  if (PATH_TO_SECTION[normalizedPath]) {
    return PATH_TO_SECTION[normalizedPath];
  }
  if (normalizedPath.startsWith('/examples/')) {
    return 'examples';
  }
  return 'gallery';
}

function resolveSectionFromUrl(): string {
  const hash = window.location.hash.replace('#', '').trim();
  if (hash && SECTION_TO_PATH[hash]) {
    return hash;
  }
  return resolveSectionFromPath(window.location.pathname);
}

function resolveTabFromSection(sectionId: string): string {
  if (sectionId.startsWith('example-')) {
    return 'examples';
  }
  return sectionId;
}

function ensureLandingHeroAnimation() {
  if (landingHeroInstance) return;
  const heroSvg = document.getElementById('landing-hero-icon') as SVGElement | null;
  if (!heroSvg) return;
  landingHeroInstance = new StrokeSVG(heroSvg, {
    type: 'delayed',
    duration: 1800,
    easing: 'easeInOut',
    start: 'manual',
    renderMode: 'outline',
  });
}

function playLandingHeroAnimation() {
  ensureLandingHeroAnimation();
  landingHeroInstance?.reset().play();
}

function ensureDashboardAnimations() {
  if (dashboardInstances.length > 0) return;
  const configs = [
    { id: 'dashboard-icon-analytics', type: 'delayed' as const, duration: 1400 },
    { id: 'dashboard-icon-users', type: 'wave' as const, duration: 1600 },
    { id: 'dashboard-icon-alerts', type: 'oneByOne' as const, duration: 1300 },
  ];

  configs.forEach(({ id, type, duration }) => {
    const svg = document.getElementById(id) as SVGElement | null;
    if (!svg) return;
    dashboardInstances.push(
      new StrokeSVG(svg, {
        type,
        duration,
        easing: 'easeInOut',
        start: 'manual',
      })
    );
  });
}

function playDashboardAnimations() {
  ensureDashboardAnimations();
  dashboardInstances.forEach((instance) => instance.reset().play());
}

function ensureDocsPageAnimations() {
  if (docsIconInstances.length > 0) return;

  const icons = document.querySelectorAll<SVGElement>(
    '#example-docs [data-docs-icon]'
  );
  const fallbackTypes = [
    'delayed',
    'fromCenter',
    'wave',
    'oneByOne',
    'converge',
    'sync',
  ] as const;

  icons.forEach((svg, index) => {
    const type = (svg.getAttribute('data-docs-type') ??
      fallbackTypes[index % fallbackTypes.length]) as (typeof fallbackTypes)[number];
    const durationValue = Number.parseInt(
      svg.getAttribute('data-docs-duration') ?? '',
      10
    );
    const duration = Number.isFinite(durationValue)
      ? durationValue
      : 1200 + index * 140;

    docsIconInstances.push(
      new StrokeSVG(svg, {
        type,
        duration,
        easing: 'easeInOut',
        start: 'inViewport',
        renderMode: 'outline',
        viewportThreshold: 0.35,
        viewportRootMargin: '0px 0px -12% 0px',
      })
    );
  });
}

type PricingTabId = 'starter' | 'pro' | 'enterprise';

function ensurePricingIconAnimation(tabId: PricingTabId) {
  if (pricingIconInstances[tabId]) return pricingIconInstances[tabId];

  const iconIdByTab: Record<PricingTabId, string> = {
    starter: 'pricing-icon-starter',
    pro: 'pricing-icon-pro',
    enterprise: 'pricing-icon-enterprise',
  };
  const animationByTab: Record<
    PricingTabId,
    { type: 'delayed' | 'wave' | 'oneByOne'; duration: number }
  > = {
    starter: { type: 'delayed', duration: 1200 },
    pro: { type: 'wave', duration: 1450 },
    enterprise: { type: 'oneByOne', duration: 1300 },
  };

  const svg = document.getElementById(iconIdByTab[tabId]) as SVGElement | null;
  if (!svg) return undefined;

  const instance = new StrokeSVG(svg, {
    type: animationByTab[tabId].type,
    duration: animationByTab[tabId].duration,
    easing: 'easeInOut',
    start: 'manual',
  });
  pricingIconInstances[tabId] = instance;
  return instance;
}

function playPricingTabAnimation(tabId: PricingTabId) {
  ensurePricingIconAnimation(tabId)?.reset().play();
}

function activatePricingTab(tabId: PricingTabId, animate = true) {
  const tabButtons =
    document.querySelectorAll<HTMLButtonElement>('[data-pricing-tab]');
  const panels =
    document.querySelectorAll<HTMLElement>('[data-pricing-panel]');

  tabButtons.forEach((button) => {
    const isActive = button.getAttribute('data-pricing-tab') === tabId;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  panels.forEach((panel) => {
    const isActive = panel.getAttribute('data-pricing-panel') === tabId;
    panel.classList.toggle('active', isActive);
  });

  if (animate) {
    playPricingTabAnimation(tabId);
  }
}

function getActivePricingTab(): PricingTabId {
  const activeTab = document
    .querySelector<HTMLButtonElement>('.pricing-tab.active')
    ?.getAttribute('data-pricing-tab');
  if (activeTab === 'pro' || activeTab === 'enterprise') {
    return activeTab;
  }
  return 'starter';
}

function initPricingTabs() {
  if (pricingTabsInitialized) return;
  pricingTabsInitialized = true;

  const tabButtons =
    document.querySelectorAll<HTMLButtonElement>('[data-pricing-tab]');
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-pricing-tab');
      if (tabId === 'starter' || tabId === 'pro' || tabId === 'enterprise') {
        activatePricingTab(tabId, true);
      }
    });
  });
}

function applySidebarCollapsedState(collapsed: boolean) {
  if (!appLayout || !sidebarToggle) return;
  appLayout.classList.toggle('sidebar-collapsed', collapsed);
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  sidebarToggle.setAttribute('aria-label', label);
  sidebarToggle.title = label;
}

function activateSection(
  sectionId: string,
  updateUrl = true,
  replaceUrl = false
) {
  const tabId = resolveTabFromSection(sectionId);

  // 1. Update Nav
  navItems.forEach((n) => {
    if (n.getAttribute('data-tab') === tabId) {
      n.classList.add('active');
    } else {
      n.classList.remove('active');
    }
  });

  // 2. Update Section
  sections.forEach((s) => {
    if (s.id === sectionId) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });
  if (sectionId === 'example-landing') {
    playLandingHeroAnimation();
  }
  if (sectionId === 'example-dashboard') {
    playDashboardAnimations();
  }
  if (sectionId === 'example-pricing') {
    activatePricingTab(getActivePricingTab(), true);
  }
  if (sectionId === 'example-docs') {
    ensureDocsPageAnimations();
  }
  window.requestAnimationFrame(() => refreshPerfectScrollbars());

  // 3. Update URL path for deep-linking
  if (!updateUrl) return;
  const path = SECTION_TO_PATH[sectionId] ?? SECTION_TO_PATH.gallery;
  if (window.location.pathname !== path) {
    if (replaceUrl) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
  }
}

// Event Listeners
navItems.forEach((item) => {
  item.addEventListener('click', () => {
    const targetId = item.getAttribute('data-tab');
    if (targetId) activateSection(targetId);
  });
  const label = item.querySelector('span')?.textContent?.trim();
  if (label) item.setAttribute('title', label);
});

document.querySelectorAll<HTMLAnchorElement>('a[href^="/examples"]').forEach(
  (anchor) => {
    anchor.addEventListener('click', (event) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      event.preventDefault();
      const href = anchor.getAttribute('href');
      if (!href) return;
      activateSection(resolveSectionFromPath(href));
    });
  }
);

if (appLayout && sidebarToggle) {
  const savedState = window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
  applySidebarCollapsedState(savedState === '1');

  sidebarToggle.addEventListener('click', () => {
    const nextCollapsed = !appLayout.classList.contains('sidebar-collapsed');
    applySidebarCollapsedState(nextCollapsed);
    window.localStorage.setItem(
      SIDEBAR_COLLAPSE_STORAGE_KEY,
      nextCollapsed ? '1' : '0'
    );
    window.requestAnimationFrame(() => refreshPerfectScrollbars());
  });
}

window.addEventListener('resize', () => {
  refreshPerfectScrollbars();
});

// Handle Back/Forward buttons
window.addEventListener('popstate', () => {
  activateSection(resolveSectionFromUrl(), false);
});

// Initial Load
const initialSection = resolveSectionFromUrl();
activateSection(initialSection, false);
const canonicalPath =
  SECTION_TO_PATH[initialSection] ?? SECTION_TO_PATH.gallery;
if (window.location.pathname !== canonicalPath) {
  window.history.replaceState(null, '', canonicalPath);
}

// Initialize Icons
registerLucideIcons();
