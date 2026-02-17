import {
  StrokeSVG,
  type AnimationType,
  type EasingPreset,
  type RenderMode,
  type StrokeSVGOptions,
} from '../src/index';
import { renderHighlightedCode, type CodeLanguage } from './codeHighlight';

type CodeTab = 'usage' | 'embed' | 'svg';
type LineCap = 'round' | 'butt' | 'square';
type LineJoin = 'round' | 'miter' | 'bevel';

interface IconifySearchResponse {
  icons?: string[];
}

interface IconLibraryOption {
  id: string;
  label: string;
  prefixes?: string[];
}

interface IconStyleOptions {
  theme: string;
  strokeWidth: number;
  strokeColor: string;
  useGradient: boolean;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  lineCap: LineCap;
  lineJoin: LineJoin;
}

interface IconStyleTheme {
  id: string;
  label: string;
  style: Partial<IconStyleOptions>;
}

const ICON_LIBRARIES: IconLibraryOption[] = [
  { id: 'lucide', label: 'Lucide', prefixes: ['lucide', 'lucide-lab'] },
  {
    id: 'heroicons',
    label: 'Heroicons',
    prefixes: ['heroicons', 'heroicons-outline'],
  },
  {
    id: 'material-icons',
    label: 'Material Icons',
    prefixes: ['material-symbols', 'material-symbols-light', 'ic'],
  },
  {
    id: 'font-awesome',
    label: 'FontAwesome',
    prefixes: [
      'fa6-solid',
      'fa6-regular',
      'fa6-brands',
      'fa7-solid',
      'fa7-regular',
      'fa7-brands',
    ],
  },
  { id: 'iconify', label: 'Iconify' },
  { id: 'ionicons', label: 'Ionicons', prefixes: ['ion'] },
  { id: 'carbon', label: 'Carbon', prefixes: ['carbon'] },
  { id: 'phosphor', label: 'Phosphor', prefixes: ['ph'] },
];

const STYLE_THEMES: IconStyleTheme[] = [
  { id: 'custom', label: 'Custom', style: {} },
  {
    id: 'mono',
    label: 'Mono Ink',
    style: {
      useGradient: false,
      strokeColor: '#111827',
      strokeWidth: 2,
      lineCap: 'round',
      lineJoin: 'round',
    },
  },
  {
    id: 'ocean',
    label: 'Ocean Beam',
    style: {
      useGradient: true,
      gradientFrom: '#0284c7',
      gradientTo: '#38bdf8',
      gradientAngle: 35,
      strokeWidth: 2.2,
      lineCap: 'round',
      lineJoin: 'round',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset Flow',
    style: {
      useGradient: true,
      gradientFrom: '#f97316',
      gradientTo: '#ec4899',
      gradientAngle: 35,
      strokeWidth: 2.4,
      lineCap: 'round',
      lineJoin: 'round',
    },
  },
  {
    id: 'neon',
    label: 'Neon Wire',
    style: {
      useGradient: true,
      gradientFrom: '#22d3ee',
      gradientTo: '#a3e635',
      gradientAngle: 320,
      strokeWidth: 1.8,
      lineCap: 'round',
      lineJoin: 'round',
    },
  },
];

const DEFAULT_ICON = 'lucide:house';
const SHAPE_SELECTOR = 'path, circle, rect, ellipse, line, polyline, polygon';
const SVG_NS = 'http://www.w3.org/2000/svg';

export class Library {
  private container: HTMLElement;
  private layoutRoot: HTMLElement;
  private resultsContainer: HTMLElement;
  private controlsBody: HTMLElement;
  private controlsToggleButton: HTMLButtonElement;
  private previewContainer: HTMLElement;
  private codeContainer: HTMLElement;
  private searchInput: HTMLInputElement;
  private librarySelect: HTMLSelectElement;
  private statusText: HTMLElement;
  private copyButton: HTMLButtonElement;
  private playButton: HTMLButtonElement;
  private autorunButton: HTMLButtonElement;
  private themeSelect: HTMLSelectElement;
  private strokeWidthRange: HTMLInputElement;
  private strokeWidthInput: HTMLInputElement;
  private strokeColorInput: HTMLInputElement;
  private gradientToggle: HTMLInputElement;
  private gradientFromInput: HTMLInputElement;
  private gradientToInput: HTMLInputElement;
  private gradientAngleInput: HTMLInputElement;
  private gradientAngleValue: HTMLElement;
  private lineCapSelect: HTMLSelectElement;
  private lineJoinSelect: HTMLSelectElement;
  private outlineColorInput: HTMLInputElement;
  private controlsCollapsed = false;
  private isPlaying = false;
  private hasCompleted = false;
  private autorunEnabled = false;
  private activeTab: CodeTab = 'usage';
  private selectedIconName = '';
  private selectedSvgMarkup = '';
  private searchAbort: AbortController | null = null;
  private instance: StrokeSVG | null = null;
  private options: StrokeSVGOptions = {
    type: 'delayed',
    duration: 1500,
    easing: 'easeInOut',
    start: 'manual',
    renderMode: 'blank',
    outlineColor: '#9ca3af',
  };
  private styleOptions: IconStyleOptions = {
    theme: 'custom',
    strokeWidth: 1,
    strokeColor: '#5e5ce6',
    useGradient: false,
    gradientFrom: '#5e5ce6',
    gradientTo: '#0ea5e9',
    gradientAngle: 45,
    lineCap: 'round',
    lineJoin: 'round',
  };

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Library container #${containerId} not found`);
    this.container = el;

    this.renderUI();

    this.layoutRoot = this.container.querySelector(
      '.library-layout'
    ) as HTMLElement;
    this.resultsContainer = this.container.querySelector(
      '.library-results'
    ) as HTMLElement;
    this.controlsBody = this.container.querySelector(
      '.library-controls-body'
    ) as HTMLElement;
    this.controlsToggleButton = this.container.querySelector(
      '#library-toggle-controls'
    ) as HTMLButtonElement;
    this.previewContainer = this.container.querySelector(
      '.library-preview'
    ) as HTMLElement;
    this.codeContainer = this.container.querySelector(
      '.library-code pre'
    ) as HTMLElement;
    this.searchInput = this.container.querySelector(
      '#library-search'
    ) as HTMLInputElement;
    this.librarySelect = this.container.querySelector(
      '#library-source'
    ) as HTMLSelectElement;
    this.statusText = this.container.querySelector(
      '.library-status'
    ) as HTMLElement;
    this.copyButton = this.container.querySelector(
      '#library-copy-code'
    ) as HTMLButtonElement;
    this.playButton = this.container.querySelector(
      '#library-play'
    ) as HTMLButtonElement;
    this.autorunButton = this.container.querySelector(
      '#library-autorun'
    ) as HTMLButtonElement;
    this.themeSelect = this.container.querySelector(
      '#library-theme'
    ) as HTMLSelectElement;
    this.strokeWidthRange = this.container.querySelector(
      '#library-stroke-width'
    ) as HTMLInputElement;
    this.strokeWidthInput = this.container.querySelector(
      '#library-stroke-width-number'
    ) as HTMLInputElement;
    this.strokeColorInput = this.container.querySelector(
      '#library-stroke-color'
    ) as HTMLInputElement;
    this.gradientToggle = this.container.querySelector(
      '#library-use-gradient'
    ) as HTMLInputElement;
    this.gradientFromInput = this.container.querySelector(
      '#library-gradient-from'
    ) as HTMLInputElement;
    this.gradientToInput = this.container.querySelector(
      '#library-gradient-to'
    ) as HTMLInputElement;
    this.gradientAngleInput = this.container.querySelector(
      '#library-gradient-angle'
    ) as HTMLInputElement;
    this.gradientAngleValue = this.container.querySelector(
      '#library-gradient-angle-value'
    ) as HTMLElement;
    this.lineCapSelect = this.container.querySelector(
      '#library-linecap'
    ) as HTMLSelectElement;
    this.lineJoinSelect = this.container.querySelector(
      '#library-linejoin'
    ) as HTMLSelectElement;
    this.outlineColorInput = this.container.querySelector(
      '#library-outline-color'
    ) as HTMLInputElement;

    this.syncStyleControls();
    this.updateStyleInputStates();
    this.updateOutlineColorControl();
    this.attachListeners();
    void this.bootstrap();
  }

  private renderUI() {
    const libraryOptions = ICON_LIBRARIES.map(
      (library) => `<option value="${library.id}">${library.label}</option>`
    ).join('');

    const themeOptions = STYLE_THEMES.map(
      (theme) => `<option value="${theme.id}">${theme.label}</option>`
    ).join('');

    this.container.innerHTML = `
      <div class="library-layout">
        <div class="library-controls">
          <div class="library-controls-head">
            <span class="library-controls-label">Controls</span>
            <button id="library-toggle-controls" class="library-toggle-btn" type="button" aria-expanded="true">Collapse</button>
          </div>
          <div class="library-controls-body">
          <div class="library-search-block">
            <label for="library-source">Source</label>
            <select id="library-source">${libraryOptions}</select>
          </div>

          <div class="library-search-block">
            <label for="library-search">Search Icon</label>
            <div class="library-search-row">
              <input id="library-search" type="text" placeholder="Try: house, activity, user..." />
              <button id="library-search-btn" class="primary" type="button">Search</button>
            </div>
            <p class="library-status">Search an icon to begin.</p>
            <p class="library-warning">
              Not every icon animates cleanly. Animpath works best with line/path-based SVGs;
              filled, compound, or complex icons may render imperfectly and cannot always be converted.
            </p>
          </div>

          <div class="library-results"></div>

          <div class="wizard-options">
            <label for="library-type">Effect</label>
            <select name="type" id="library-type">
              <option value="delayed">Delayed</option>
              <option value="sync">Sync</option>
              <option value="oneByOne">One By One</option>
              <option value="stagger">Stagger</option>
              <option value="randomOrder">Random Order</option>
              <option value="fromCenter">From Center</option>
              <option value="converge">Converge</option>
              <option value="wave">Wave</option>
            </select>

            <label for="library-duration">Duration (ms)</label>
            <input type="number" name="duration" id="library-duration" value="1500" step="100" min="100" />

            <label for="library-easing">Timing</label>
            <select name="easing" id="library-easing">
              <option value="linear">Linear</option>
              <option value="easeIn">EaseIn</option>
              <option value="easeOut">EaseOut</option>
              <option value="easeInOut" selected>EaseInOut</option>
              <option value="easeInBack">EaseInBack</option>
              <option value="easeOutBounce">EaseOutBounce</option>
              <option value="easeOutElastic">EaseOutElastic</option>
            </select>

            <label for="library-render-mode">Render Mode</label>
            <select name="renderMode" id="library-render-mode">
              <option value="blank" selected>Blank</option>
              <option value="outline">Outline</option>
            </select>

            <label for="library-outline-color">Outline Color</label>
            <input type="color" name="outlineColor" id="library-outline-color" value="#9ca3af" />

          </div>

          <div class="library-style-panel">
            <details class="library-style-details">
              <summary class="library-style-title">Style & Theme</summary>
              <div class="library-style-grid">
              <label for="library-theme">Theme</label>
              <select id="library-theme">${themeOptions}</select>

              <label for="library-stroke-width">Stroke Width</label>
              <div class="library-inline-inputs">
                <input id="library-stroke-width" type="range" min="0.5" max="8" step="0.1" value="1" />
                <input id="library-stroke-width-number" type="number" min="0.5" max="8" step="0.1" value="1" />
              </div>

              <label for="library-linecap">Line Cap</label>
              <select id="library-linecap">
                <option value="round">Round</option>
                <option value="butt">Butt</option>
                <option value="square">Square</option>
              </select>

              <label for="library-linejoin">Line Join</label>
              <select id="library-linejoin">
                <option value="round">Round</option>
                <option value="miter">Miter</option>
                <option value="bevel">Bevel</option>
              </select>

              <label for="library-stroke-color">Solid Color</label>
              <input id="library-stroke-color" type="color" value="#5e5ce6" />

              <div class="checkbox library-gradient-toggle">
                <input type="checkbox" id="library-use-gradient" />
                <label for="library-use-gradient" style="margin: 0; display: inline;">Use Gradient Stroke</label>
              </div>

              <label for="library-gradient-from">Gradient From</label>
              <input id="library-gradient-from" type="color" value="#5e5ce6" />

              <label for="library-gradient-to">Gradient To</label>
              <input id="library-gradient-to" type="color" value="#0ea5e9" />

              <label for="library-gradient-angle">Gradient Angle</label>
              <div class="library-inline-inputs">
                <input id="library-gradient-angle" type="range" min="0" max="360" step="1" value="45" />
                <span id="library-gradient-angle-value" class="library-angle-value">45 deg</span>
              </div>
            </div>
            </details>
          </div>

          <div class="wizard-actions">
            <button id="library-play" class="primary" type="button">
              <i data-lucide="play" class="icon-primary"></i>
              <i data-lucide="pause" class="icon-alternate" style="display: none"></i>
              <span>Play</span>
            </button>
            <button id="library-autorun" type="button">
              <i data-lucide="infinity" class="icon-primary"></i>
              <i data-lucide="square" class="icon-alternate" style="display: none"></i>
              <span>Autorun</span>
            </button>
          </div>
          </div>
        </div>

        <div class="wizard-display">
          <div class="library-preview"></div>

          <div class="wizard-code-section">
            <div class="wizard-tabs">
              <button class="wizard-tab active" data-code-tab="usage" type="button">Usage</button>
              <button class="wizard-tab" data-code-tab="embed" type="button">CDN / Embed</button>
              <button class="wizard-tab" data-code-tab="svg" type="button">SVG</button>
              <button id="library-copy-code" class="library-copy-btn" type="button">Copy Code</button>
            </div>
            <div class="library-code">
              <pre></pre>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private attachListeners() {
    this.controlsToggleButton.addEventListener('click', () => {
      this.setControlsCollapsed(!this.controlsCollapsed);
    });

    this.searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void this.searchIcons();
      }
    });

    this.container
      .querySelector('#library-search-btn')
      ?.addEventListener('click', () => {
        void this.searchIcons();
      });

    this.librarySelect.addEventListener('change', () => {
      if (this.searchInput.value.trim()) {
        void this.searchIcons();
      }
    });

    this.resultsContainer.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest(
        '[data-icon-name]'
      ) as HTMLButtonElement | null;
      const iconName = button?.dataset.iconName;
      if (iconName) {
        void this.selectIcon(iconName);
      }
    });

    const animationInputs = this.container.querySelectorAll(
      '#library-type, #library-duration, #library-easing, #library-render-mode, #library-outline-color'
    );

    animationInputs.forEach((input) => {
      input.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const name = target.name;

        if (name === 'type') this.options.type = target.value as AnimationType;
        if (name === 'duration') {
          const parsedDuration = Number.parseInt(target.value, 10);
          this.options.duration =
            Number.isFinite(parsedDuration) && parsedDuration > 0
              ? parsedDuration
              : 1500;
        }
        if (name === 'easing') {
          this.options.easing = target.value as EasingPreset;
        }
        if (name === 'renderMode') {
          this.options.renderMode = target.value as RenderMode;
        }
        if (name === 'outlineColor') {
          this.options.outlineColor = target.value;
        }

        this.updateOutlineColorControl();
        this.updateInstance();
      });
    });

    this.themeSelect.addEventListener('change', () => {
      this.applyTheme(this.themeSelect.value);
      this.updateStyleInputStates();
      this.refreshStyledOutput();
    });

    this.strokeWidthRange.addEventListener('input', () => {
      this.markThemeCustom();
      this.setStrokeWidth(this.strokeWidthRange.value);
      this.syncStyleControls();
      this.refreshStyledOutput();
    });

    this.strokeWidthInput.addEventListener('input', () => {
      this.markThemeCustom();
      this.setStrokeWidth(this.strokeWidthInput.value);
      this.syncStyleControls();
      this.refreshStyledOutput();
    });

    this.strokeColorInput.addEventListener('input', () => {
      this.markThemeCustom();
      this.styleOptions.strokeColor = this.strokeColorInput.value;
      this.refreshStyledOutput();
    });

    this.gradientToggle.addEventListener('change', () => {
      this.markThemeCustom();
      this.styleOptions.useGradient = this.gradientToggle.checked;
      this.updateStyleInputStates();
      this.refreshStyledOutput();
    });

    this.gradientFromInput.addEventListener('input', () => {
      this.markThemeCustom();
      this.styleOptions.gradientFrom = this.gradientFromInput.value;
      this.refreshStyledOutput();
    });

    this.gradientToInput.addEventListener('input', () => {
      this.markThemeCustom();
      this.styleOptions.gradientTo = this.gradientToInput.value;
      this.refreshStyledOutput();
    });

    this.gradientAngleInput.addEventListener('input', () => {
      this.markThemeCustom();
      this.styleOptions.gradientAngle = this.toBoundedNumber(
        this.gradientAngleInput.value,
        0,
        360,
        this.styleOptions.gradientAngle
      );
      this.syncStyleControls();
      this.refreshStyledOutput();
    });

    this.lineCapSelect.addEventListener('change', () => {
      this.markThemeCustom();
      this.styleOptions.lineCap = this.lineCapSelect.value as LineCap;
      this.refreshStyledOutput();
    });

    this.lineJoinSelect.addEventListener('change', () => {
      this.markThemeCustom();
      this.styleOptions.lineJoin = this.lineJoinSelect.value as LineJoin;
      this.refreshStyledOutput();
    });

    this.playButton.addEventListener('click', () => this.togglePlayPause());
    this.autorunButton.addEventListener('click', () => this.toggleAutorun());

    const tabs = this.container.querySelectorAll('.wizard-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (event) => {
        const target = event.currentTarget as HTMLButtonElement;
        const tabId = target.dataset.codeTab as CodeTab;

        tabs.forEach((node) => node.classList.remove('active'));
        target.classList.add('active');

        this.activeTab = tabId;
        this.renderCode();
      });
    });

    this.copyButton.addEventListener('click', () => {
      void this.copyCurrentCode();
    });

    this.refreshPlayButton();
    this.refreshAutorunButton();
  }

  private async bootstrap() {
    this.searchInput.value = 'house';
    await this.selectIcon(DEFAULT_ICON);
    await this.searchIcons();
  }

  private setControlsCollapsed(collapsed: boolean) {
    this.controlsCollapsed = collapsed;
    this.layoutRoot.classList.toggle('is-controls-collapsed', collapsed);
    this.controlsBody.classList.toggle('is-hidden', collapsed);
    this.controlsToggleButton.textContent = collapsed ? 'Expand' : 'Collapse';
    this.controlsToggleButton.setAttribute('aria-expanded', String(!collapsed));
  }

  private setStrokeWidth(nextValue: string) {
    this.styleOptions.strokeWidth = this.toBoundedNumber(
      nextValue,
      0.5,
      8,
      this.styleOptions.strokeWidth
    );
  }

  private toBoundedNumber(
    value: string,
    min: number,
    max: number,
    fallback: number
  ): number {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  private syncStyleControls() {
    this.themeSelect.value = this.styleOptions.theme;
    this.strokeWidthRange.value = this.styleOptions.strokeWidth.toFixed(1);
    this.strokeWidthInput.value = this.styleOptions.strokeWidth.toFixed(1);
    this.strokeColorInput.value = this.styleOptions.strokeColor;
    this.gradientToggle.checked = this.styleOptions.useGradient;
    this.gradientFromInput.value = this.styleOptions.gradientFrom;
    this.gradientToInput.value = this.styleOptions.gradientTo;
    this.gradientAngleInput.value = String(
      Math.round(this.styleOptions.gradientAngle)
    );
    this.gradientAngleValue.textContent = `${Math.round(this.styleOptions.gradientAngle)} deg`;
    this.lineCapSelect.value = this.styleOptions.lineCap;
    this.lineJoinSelect.value = this.styleOptions.lineJoin;
  }

  private updateStyleInputStates() {
    const useGradient = this.styleOptions.useGradient;
    this.strokeColorInput.disabled = useGradient;
    this.gradientFromInput.disabled = !useGradient;
    this.gradientToInput.disabled = !useGradient;
    this.gradientAngleInput.disabled = !useGradient;
    this.gradientAngleValue.classList.toggle('is-disabled', !useGradient);
  }

  private updateOutlineColorControl() {
    this.outlineColorInput.disabled = this.options.renderMode !== 'outline';
  }

  private applyTheme(themeId: string) {
    if (themeId === 'custom') {
      this.styleOptions.theme = 'custom';
      this.syncStyleControls();
      return;
    }

    const theme = STYLE_THEMES.find((candidate) => candidate.id === themeId);
    if (!theme) return;

    this.styleOptions = {
      ...this.styleOptions,
      ...theme.style,
      theme: theme.id,
    };
    this.syncStyleControls();
  }

  private markThemeCustom() {
    if (this.styleOptions.theme !== 'custom') {
      this.styleOptions.theme = 'custom';
      this.themeSelect.value = 'custom';
    }
  }

  private refreshStyledOutput() {
    this.updatePreview();
    this.updateInstance();
  }

  private async searchIcons() {
    const query = this.searchInput.value.trim();
    if (!query) {
      this.statusText.textContent = 'Enter a keyword to search.';
      this.resultsContainer.innerHTML = '';
      return;
    }

    this.searchAbort?.abort();
    this.searchAbort = new AbortController();

    this.statusText.textContent = 'Searching icons...';
    this.resultsContainer.innerHTML = '';

    try {
      const selectedLibrary = ICON_LIBRARIES.find(
        (library) => library.id === this.librarySelect.value
      );
      let icons: string[] = [];

      if (!selectedLibrary || !selectedLibrary.prefixes?.length) {
        icons = await this.fetchIconSearch(query, undefined, 48);
      } else {
        const fromPrefixes = await Promise.all(
          selectedLibrary.prefixes.map((prefix) =>
            this.fetchIconSearch(query, prefix, 36)
          )
        );

        icons = this.uniqueFlatten(fromPrefixes).slice(0, 48);
      }

      if (icons.length === 0) {
        const globalFallback = await this.fetchIconSearch(query, undefined, 48);
        if (globalFallback.length > 0 && selectedLibrary) {
          this.statusText.textContent = `No "${query}" in ${selectedLibrary.label}. Showing matches from all libraries.`;
          this.renderSearchResults(globalFallback);
          return;
        }

        this.statusText.textContent =
          'No icons found. Try another keyword or source.';
        this.resultsContainer.innerHTML = '';
        return;
      }

      this.statusText.textContent = `${icons.length} icon${icons.length > 1 ? 's' : ''} found.`;
      this.renderSearchResults(icons);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      this.statusText.textContent = 'Could not load icons right now.';
      console.error('Library search failed:', error);
    }
  }

  private async fetchIconSearch(
    query: string,
    prefix?: string,
    limit = 36
  ): Promise<string[]> {
    if (!this.searchAbort) return [];

    const searchUrl = new URL('https://api.iconify.design/search');
    searchUrl.searchParams.set('query', query);
    searchUrl.searchParams.set('limit', String(limit));
    if (prefix) {
      searchUrl.searchParams.set('prefix', prefix);
    }

    const response = await fetch(searchUrl.toString(), {
      signal: this.searchAbort.signal,
    });

    if (!response.ok) {
      throw new Error(`Search failed (${response.status})`);
    }

    const data = (await response.json()) as IconifySearchResponse;
    return data.icons ?? [];
  }

  private uniqueFlatten(groups: string[][]): string[] {
    const ordered = new Set<string>();
    groups.forEach((group) => {
      group.forEach((icon) => {
        if (!ordered.has(icon)) {
          ordered.add(icon);
        }
      });
    });

    return [...ordered];
  }

  private renderSearchResults(iconNames: string[]) {
    this.resultsContainer.innerHTML = '';

    iconNames.forEach((iconName) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'library-item';
      if (iconName === this.selectedIconName) {
        button.classList.add('active');
      }
      button.dataset.iconName = iconName;

      const [prefix, icon] = iconName.split(':');
      const image = document.createElement('img');
      image.src = `https://api.iconify.design/${iconName}.svg?width=40&height=40`;
      image.alt = iconName;
      image.loading = 'lazy';

      const name = document.createElement('span');
      name.className = 'library-item-name';
      name.textContent = icon ?? iconName;

      const source = document.createElement('small');
      source.className = 'library-item-prefix';
      source.textContent = prefix ?? '';

      button.append(image, name, source);
      this.resultsContainer.appendChild(button);
    });
  }

  private async selectIcon(iconName: string) {
    this.statusText.textContent = `Loading ${iconName}...`;

    try {
      const response = await fetch(
        `https://api.iconify.design/${iconName}.svg`
      );
      if (!response.ok) {
        throw new Error(`Icon fetch failed (${response.status})`);
      }

      const rawSvg = await response.text();
      this.selectedSvgMarkup = this.normalizeToStrokeSvg(rawSvg);
      this.selectedIconName = iconName;

      this.renderSearchResultsFromDom();
      this.refreshStyledOutput();
      this.statusText.textContent = `Selected: ${iconName}`;
    } catch (error) {
      this.statusText.textContent = 'Unable to load this icon.';
      console.error('Failed to select icon:', error);
    }
  }

  private renderSearchResultsFromDom() {
    const itemButtons =
      this.resultsContainer.querySelectorAll<HTMLButtonElement>(
        '.library-item'
      );
    itemButtons.forEach((button) => {
      button.classList.toggle(
        'active',
        button.dataset.iconName === this.selectedIconName
      );
    });
  }

  private normalizeToStrokeSvg(svgMarkup: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return svgMarkup;

    const width = svg.getAttribute('width');
    const height = svg.getAttribute('height');
    if (!svg.getAttribute('viewBox') && width && height) {
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    svg.setAttribute('xmlns', SVG_NS);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    doc.querySelectorAll('script, foreignObject').forEach((el) => el.remove());
    doc.querySelectorAll('*').forEach((node) => {
      [...node.attributes].forEach((attribute) => {
        if (attribute.name.toLowerCase().startsWith('on')) {
          node.removeAttribute(attribute.name);
        }
      });
    });

    doc.querySelectorAll(SHAPE_SELECTOR).forEach((shape) => {
      shape.removeAttribute('style');
      shape.setAttribute('fill', 'none');
      shape.setAttribute('stroke', 'currentColor');
      if (!shape.getAttribute('stroke-width')) {
        shape.setAttribute('stroke-width', '2');
      }
      shape.setAttribute(
        'stroke-linecap',
        shape.getAttribute('stroke-linecap') ?? 'round'
      );
      shape.setAttribute(
        'stroke-linejoin',
        shape.getAttribute('stroke-linejoin') ?? 'round'
      );
    });

    return svg.outerHTML;
  }

  private getStyledSvgMarkup(): string {
    if (!this.selectedSvgMarkup) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(this.selectedSvgMarkup, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return this.selectedSvgMarkup;

    const safeIconPart =
      this.selectedIconName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() ||
      'icon';
    const gradientId = `animpath-gradient-${safeIconPart}`;

    svg
      .querySelectorAll('defs[data-animpath="generated-gradient"]')
      .forEach((node) => {
        node.remove();
      });

    if (this.styleOptions.useGradient) {
      const defs = doc.createElementNS(SVG_NS, 'defs');
      defs.setAttribute('data-animpath', 'generated-gradient');

      const gradient = doc.createElementNS(SVG_NS, 'linearGradient');
      gradient.setAttribute('id', gradientId);
      const coords = this.computeGradientCoordinates(
        this.styleOptions.gradientAngle
      );
      gradient.setAttribute('x1', coords.x1);
      gradient.setAttribute('y1', coords.y1);
      gradient.setAttribute('x2', coords.x2);
      gradient.setAttribute('y2', coords.y2);

      const start = doc.createElementNS(SVG_NS, 'stop');
      start.setAttribute('offset', '0%');
      start.setAttribute('stop-color', this.styleOptions.gradientFrom);

      const end = doc.createElementNS(SVG_NS, 'stop');
      end.setAttribute('offset', '100%');
      end.setAttribute('stop-color', this.styleOptions.gradientTo);

      gradient.append(start, end);
      defs.appendChild(gradient);
      svg.insertBefore(defs, svg.firstChild);
    }

    const strokePaint = this.styleOptions.useGradient
      ? `url(#${gradientId})`
      : this.styleOptions.strokeColor;
    const strokeWidth = String(this.styleOptions.strokeWidth);

    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', strokePaint);
    svg.setAttribute('stroke-width', strokeWidth);
    svg.setAttribute('stroke-linecap', this.styleOptions.lineCap);
    svg.setAttribute('stroke-linejoin', this.styleOptions.lineJoin);

    svg.querySelectorAll(SHAPE_SELECTOR).forEach((shape) => {
      shape.setAttribute('fill', 'none');
      shape.setAttribute('stroke', strokePaint);
      shape.setAttribute('stroke-width', strokeWidth);
      shape.setAttribute('stroke-linecap', this.styleOptions.lineCap);
      shape.setAttribute('stroke-linejoin', this.styleOptions.lineJoin);
    });

    return svg.outerHTML;
  }

  private computeGradientCoordinates(angleDeg: number): {
    x1: string;
    y1: string;
    x2: string;
    y2: string;
  } {
    const normalized = ((angleDeg % 360) + 360) % 360;
    const radians = (normalized * Math.PI) / 180;
    const x = Math.cos(radians);
    const y = Math.sin(radians);

    const x1 = 50 - x * 50;
    const y1 = 50 - y * 50;
    const x2 = 50 + x * 50;
    const y2 = 50 + y * 50;

    return {
      x1: `${x1.toFixed(2)}%`,
      y1: `${y1.toFixed(2)}%`,
      x2: `${x2.toFixed(2)}%`,
      y2: `${y2.toFixed(2)}%`,
    };
  }

  private updatePreview() {
    const styledSvgMarkup = this.getStyledSvgMarkup();
    if (!styledSvgMarkup) {
      this.previewContainer.innerHTML = `
        <div class="library-preview-canvas">
          <p class="library-preview-empty">Select an icon to preview.</p>
        </div>
      `;
      return;
    }

    this.previewContainer.innerHTML = `
      <div class="library-preview-canvas">
        <div class="library-preview-icon-wrap">
          ${styledSvgMarkup}
        </div>
      </div>
    `;
  }

  private updateInstance() {
    if (this.instance) this.instance.destroy();

    const svg = this.previewContainer.querySelector('svg');
    if (!svg) {
      this.renderCode();
      return;
    }

    this.isPlaying = false;
    this.hasCompleted = false;
    this.refreshPlayButton();

    this.instance = new StrokeSVG(svg, {
      ...this.options,
      loop: this.autorunEnabled,
      onStart: () => {
        this.isPlaying = true;
        this.hasCompleted = false;
        this.refreshPlayButton();
      },
      onComplete: () => {
        if (!this.autorunEnabled) {
          this.isPlaying = false;
          this.hasCompleted = true;
          this.refreshPlayButton();
        }
      },
    });

    if (this.autorunEnabled) {
      this.instance.play();
    } else if (this.options.renderMode === 'outline') {
      this.instance.reset();
      this.hasCompleted = false;
      this.refreshPlayButton();
    } else {
      this.instance.seek(1);
      this.hasCompleted = true;
      this.refreshPlayButton();
    }
    this.renderCode();
  }

  private togglePlayPause() {
    if (!this.instance) return;

    if (this.isPlaying) {
      this.instance.pause();
      this.isPlaying = false;
      this.refreshPlayButton();
      return;
    }

    if (this.hasCompleted) {
      this.instance.reset();
      this.hasCompleted = false;
    }

    this.instance.play();
  }

  private toggleAutorun() {
    this.autorunEnabled = !this.autorunEnabled;
    this.refreshAutorunButton();
    this.updateInstance();
  }

  private refreshPlayButton() {
    const primary = this.playButton.querySelector(
      '.icon-primary'
    ) as HTMLElement;
    const alternate = this.playButton.querySelector(
      '.icon-alternate'
    ) as HTMLElement;
    const label = this.playButton.querySelector('span');

    if (this.isPlaying) {
      primary.style.display = 'none';
      alternate.style.display = '';
      if (label) label.textContent = 'Pause';
    } else {
      primary.style.display = '';
      alternate.style.display = 'none';
      if (label) label.textContent = 'Play';
    }
  }

  private refreshAutorunButton() {
    const primary = this.autorunButton.querySelector(
      '.icon-primary'
    ) as HTMLElement;
    const alternate = this.autorunButton.querySelector(
      '.icon-alternate'
    ) as HTMLElement;
    const label = this.autorunButton.querySelector('span');

    if (this.autorunEnabled) {
      primary.style.display = 'none';
      alternate.style.display = '';
      if (label) label.textContent = 'Stop Autorun';
    } else {
      primary.style.display = '';
      alternate.style.display = 'none';
      if (label) label.textContent = 'Autorun';
    }
  }

  private renderCode() {
    const styledSvgMarkup = this.getStyledSvgMarkup();
    if (!styledSvgMarkup) {
      this.renderHighlightedCode('Select an icon to generate code.', 'xml');
      return;
    }

    const options = JSON.stringify(this.options, null, 2);
    const escapedSvg = styledSvgMarkup
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');

    if (this.activeTab === 'usage') {
      const usageCode = `
import { StrokeSVG } from 'animpath';

const host = document.querySelector('#icon-host');
host.innerHTML = \`${escapedSvg}\`;

const svg = host.querySelector('svg');
const anim = new StrokeSVG(svg, ${options});

anim.play();
      `.trim();
      this.renderHighlightedCode(usageCode, 'javascript');
      return;
    }

    if (this.activeTab === 'embed') {
      const embedCode = `
<div id="icon-host">${styledSvgMarkup}</div>

<script src="https://unpkg.com/animpath@latest/dist/animpath.umd.js"></script>
<script>
  const svg = document.querySelector('#icon-host svg');
  const anim = new AnimPath.StrokeSVG(svg, ${options});
  anim.play();
</script>
      `.trim();
      this.renderHighlightedCode(embedCode, 'xml');
      return;
    }

    this.renderHighlightedCode(styledSvgMarkup, 'xml');
  }

  private renderHighlightedCode(code: string, language: CodeLanguage) {
    renderHighlightedCode(this.codeContainer, code, language);
  }

  private async copyCurrentCode() {
    const content = this.codeContainer.textContent ?? '';
    if (!content.trim()) return;

    try {
      await navigator.clipboard.writeText(content);
      this.flashCopyLabel('Copied');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.flashCopyLabel('Copied');
    }
  }

  private flashCopyLabel(label: string) {
    const original = this.copyButton.textContent ?? 'Copy Code';
    this.copyButton.textContent = label;
    window.setTimeout(() => {
      this.copyButton.textContent = original;
    }, 1200);
  }
}
