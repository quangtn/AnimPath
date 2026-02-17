import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';

export type CodeLanguage = 'javascript' | 'xml';

let isInitialized = false;

function initHighlighting() {
  if (isInitialized) return;
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('xml', xml);
  isInitialized = true;
}

export function renderHighlightedCode(
  container: HTMLElement,
  code: string,
  language: CodeLanguage
) {
  initHighlighting();
  const codeElement = document.createElement('code');
  codeElement.className = `language-${language}`;
  codeElement.textContent = code;
  container.innerHTML = '';
  container.appendChild(codeElement);
  hljs.highlightElement(codeElement);
}
