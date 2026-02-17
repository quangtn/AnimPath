import { StrokeSVG, type RenderMode, type StrokeSVGOptions } from '../src/index';
import { renderHighlightedCode, type CodeLanguage } from './codeHighlight';

export class Wizard {
  private container: HTMLElement;
  private previewContainer: HTMLElement;
  private codeContainer: HTMLElement;
  private svgInput: HTMLTextAreaElement;
  private outlineColorInput: HTMLInputElement | null = null;
  private playButton: HTMLButtonElement | null = null;
  private autorunButton: HTMLButtonElement | null = null;
  private isPlaying = false;
  private hasCompleted = false;
  private autorunEnabled = false;
  private options: StrokeSVGOptions = {
    type: 'delayed',
    duration: 1500,
    easing: 'easeInOut',
    start: 'manual',
    renderMode: 'blank',
    outlineColor: '#9ca3af',
  };
  private activeTab: 'usage' | 'embed' = 'usage';
  private instance: StrokeSVG | null = null;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Wizard container #${containerId} not found`);
    this.container = el;

    this.renderUI();

    // Elements
    this.previewContainer = this.container.querySelector(
      '.wizard-preview'
    ) as HTMLElement;
    this.codeContainer = this.container.querySelector(
      '.wizard-code pre'
    ) as HTMLElement;
    this.svgInput = this.container.querySelector(
      '.wizard-input textarea'
    ) as HTMLTextAreaElement;

    this.attachListeners();
    this.update();
  }

  private renderUI() {
    this.container.innerHTML = `
      <div class="wizard-layout">
        <div class="wizard-controls">
          <div class="wizard-input">
            <label>SVG Input</label>
            <textarea placeholder="Paste SVG code here..."></textarea>
            <div class="file-upload">
              <label for="svg-file" class="upload-outline-btn">
                <i data-lucide="upload"></i>
                Upload file
              </label>
              <input type="file" id="svg-file" accept=".svg" style="display: none">
            </div>
          </div>
          
          <div class="wizard-options">
             <label for="opt-type">Type</label>
             <select name="type" id="opt-type">
                 <option value="delayed">Delayed</option>
                 <option value="sync">Sync</option>
                 <option value="oneByOne">OneByOne</option>
                 <option value="stagger">Stagger</option>
                 <option value="randomOrder">Random Order</option>
                 <option value="fromCenter">From Center</option>
                 <option value="converge">Converge</option>
                 <option value="wave">Wave</option>
             </select>

             <label for="opt-duration">Duration (ms)</label>
             <input type="number" name="duration" id="opt-duration" value="1500" step="100" min="100">

             <label for="opt-easing">Easing</label>
             <select name="easing" id="opt-easing">
                 <option value="linear">Linear</option>
                 <option value="easeIn">EaseIn</option>
                 <option value="easeOut">EaseOut</option>
                 <option value="easeInOut">EaseInOut</option>
             </select>

             <label for="opt-render-mode">Render Mode</label>
             <select name="renderMode" id="opt-render-mode">
                 <option value="blank" selected>Blank</option>
                 <option value="outline">Outline</option>
             </select>

             <label for="opt-outline-color">Outline Color</label>
             <input type="color" name="outlineColor" id="opt-outline-color" value="#9ca3af">

          </div>

          <div class="wizard-actions">
            <button id="wizard-play" class="primary" type="button">
                <i data-lucide="play" class="icon-primary"></i>
                <i data-lucide="pause" class="icon-alternate" style="display: none"></i>
                <span>Play</span>
            </button>
            <button id="wizard-autorun" type="button">
                <i data-lucide="infinity" class="icon-primary"></i>
                <i data-lucide="square" class="icon-alternate" style="display: none"></i>
                <span>Autorun</span>
            </button>
          </div>
        </div>

        <div class="wizard-display">
          <div class="wizard-preview"></div>
          
          <div class="wizard-code-section">
            <div class="wizard-tabs">
              <button class="wizard-tab active" data-code-tab="usage">Usage</button>
              <button class="wizard-tab" data-code-tab="embed">CDN / Embed</button>
            </div>
            <div class="wizard-code">
              <pre></pre>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private attachListeners() {
    this.playButton = this.container.querySelector(
      '#wizard-play'
    ) as HTMLButtonElement;
    this.autorunButton = this.container.querySelector(
      '#wizard-autorun'
    ) as HTMLButtonElement;
    this.outlineColorInput = this.container.querySelector(
      '#opt-outline-color'
    ) as HTMLInputElement | null;

    this.svgInput.addEventListener('input', () => this.update());

    const fileInput = this.container.querySelector(
      '#svg-file'
    ) as HTMLInputElement;
    fileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const rawSvg = ev.target?.result as string;
          this.svgInput.value = this.normalizeUploadedSVG(rawSvg);
          this.update();
        };
        reader.readAsText(file);
      }
    });

    const inputs = this.container.querySelectorAll(
      'select, input[type=number], input[type=color]'
    );
    inputs.forEach((input) => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement;
        const name = target.name;

        if (name === 'type') this.options.type = target.value as any;
        if (name === 'duration')
          this.options.duration = parseInt(target.value, 10);
        if (name === 'easing') this.options.easing = target.value as any;
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

    this.playButton?.addEventListener('click', () => this.togglePlayPause());
    this.autorunButton?.addEventListener('click', () => this.toggleAutorun());

    // Tab switching
    const tabs = this.container.querySelectorAll('.wizard-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabId = target.dataset.codeTab as 'usage' | 'embed';

        // Update active class
        tabs.forEach((t) => t.classList.remove('active'));
        target.classList.add('active');

        this.activeTab = tabId;
        this.renderCode();
      });
    });

    // Default SVG (Lucide: Aperture)
    this.svgInput.value = `<svg xmlns="http://www.w3.org/2000/svg" width="50%" height="50%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10" />
  <path d="m14.31 8 5.74 9.94" />
  <path d="M9.69 8h11.48" />
  <path d="m7.38 12 5.74-9.94" />
  <path d="M9.69 16 3.95 6.06" />
  <path d="M14.31 16H2.83" />
  <path d="m16.62 12-5.74 9.94" />
</svg>`;

    this.refreshPlayButton();
    this.refreshAutorunButton();
    this.updateOutlineColorControl();
  }

  private normalizeUploadedSVG(svgMarkup: string): string {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return svgMarkup;

      svg.setAttribute('width', '50%');
      svg.setAttribute('height', '50%');

      return svg.outerHTML;
    } catch {
      return svgMarkup;
    }
  }

  private update() {
    // Re-render SVG
    const svgContent = this.svgInput.value;
    try {
      this.previewContainer.innerHTML = svgContent;
      const svg = this.previewContainer.querySelector('svg');
      if (svg) {
        // Apply default styles if missing to ensure visibility
        if (!svg.getAttribute('stroke')) svg.style.stroke = '#e94560';
        if (!svg.getAttribute('fill')) svg.style.fill = 'none';
        if (!svg.getAttribute('stroke-width')) svg.style.strokeWidth = '2';

        this.updateInstance();
      }
    } catch (e) {
      console.warn('Invalid SVG', e);
    }
  }

  private updateInstance() {
    if (this.instance) this.instance.destroy();

    const svg = this.previewContainer.querySelector('svg');
    if (!svg) return;

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
    if (!this.playButton) return;
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
    if (!this.autorunButton) return;
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

  private updateOutlineColorControl() {
    if (!this.outlineColorInput) return;
    this.outlineColorInput.disabled = this.options.renderMode !== 'outline';
  }

  private renderCode() {
    const opts = JSON.stringify(this.options, null, 2);
    let code = '';
    let language: CodeLanguage = 'javascript';

    if (this.activeTab === 'usage') {
      code = `
import { StrokeSVG } from 'animpath';

const svg = document.querySelector('#my-svg');
const anim = new StrokeSVG(svg, ${opts});

anim.play();
      `.trim();
    } else {
      code = `
<!-- Include via CDN -->
<script src="https://unpkg.com/animpath@latest/dist/animpath.umd.js"></script>

<script>
  const svg = document.querySelector('#my-svg');
  // Available as global 'AnimPath'
  const anim = new AnimPath.StrokeSVG(svg, ${opts});
  
  anim.play();
</script>
      `.trim();
      language = 'xml';
    }

    this.renderHighlightedCode(code, language);
  }

  private renderHighlightedCode(code: string, language: CodeLanguage) {
    renderHighlightedCode(this.codeContainer, code, language);
  }
}
