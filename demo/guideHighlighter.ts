import { renderHighlightedCode, type CodeLanguage } from './codeHighlight';

const GUIDE_CODE_SELECTOR = '#guide pre.guide-code-block';

function resolveLanguage(value?: string | null): CodeLanguage {
  if (value === 'xml' || value === 'html') return 'xml';
  return 'javascript';
}

export function highlightGuideCodeBlocks() {
  const blocks = document.querySelectorAll<HTMLElement>(GUIDE_CODE_SELECTOR);
  blocks.forEach((block) => {
    const lang = resolveLanguage(block.dataset.lang);
    const source = block.textContent ?? '';
    renderHighlightedCode(block, source.trim(), lang);
  });
}
