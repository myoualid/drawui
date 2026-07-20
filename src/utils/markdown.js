
import { escapeHtml } from "./escapeHtml.js";

/**
 * Minimal markdown-to-HTML (no Showdown). Supports headings, fenced code blocks,
 * paragraphs, bold/italic, and lists. Code blocks get language-* class for CodeMirror/hljs.
 * @param {string} markdown - The markdown text to convert.
 * @returns {Object} Object with html property containing the converted HTML.
 * @category Utils
 */
export function simpleMarkdownToHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') return { html: '', codes: [] };
  const lines = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const out = [];
  let i = 0;

  function inline(s) {
    return s
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  while (i < lines.length) {
    const line = lines[i];
    // Fenced code block
    const openFence = line.match(/^(`{3,}|~{3,})\s*(\w*)\s*$/);
    if (openFence) {
      const lang = (openFence[2] || 'text').trim().toLowerCase();
      const fence = openFence[1];
      const closeFenceRe = new RegExp('^\\s*' + fence.charAt(0) + '{' + fence.length + ',}\\s*$');
      i++;
      const codeLines = [];
      while (i < lines.length && !closeFenceRe.test(lines[i])) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      if (i < lines.length) i++;
      const code = codeLines.join('\n');
      out.push(`<pre><code class="language-${escapeHtml(lang)}">${code}</code></pre>`);
      continue;
    }
    // ATX headings
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(escapeHtml(h[2].trim()))}</h${level}>`);
      i++;
      continue;
    }
    // Unordered list
    if (/^[-*+]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const tag = /^\d+\.\s+/.test(line) ? 'ol' : 'ul';
      out.push(`<${tag}>`);
      while (i < lines.length && (/^[-*+]\s+/.test(lines[i]) || /^\d+\.\s+/.test(lines[i]))) {
        const content = lines[i].replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');
        out.push(`<li>${inline(escapeHtml(content))}</li>`);
        i++;
      }
      out.push(`</${tag}>`);
      continue;
    }
    // Empty line → close paragraph
    if (line.trim() === '') {
      i++;
      continue;
    }
    // Paragraph
    const pLines = [line];
    i++;
    const isCollapsibleMarker = (s) => /^\[MORE(?::[^\]]+)?\]$/.test(s) || /^\[(MORE_END|HINT_END|EXPECTED_END|TAKEAWAY_END)\]$/.test(s) || /^\[HINT:[^\]]+\]$/.test(s) || /^\[EXPECTED:[^\]]+\]$/.test(s) || /^\[TAKEAWAY\]$/.test(s);
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^#{1,6}\s/) && !lines[i].match(/^(`{3,}|~{3,})/) && !/^[-*+]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i])) {
      const nextLine = lines[i].trim();
      const currentText = pLines.join('\n').trim();
      if (isCollapsibleMarker(currentText) || isCollapsibleMarker(nextLine)) {
        break;
      }
      pLines.push(lines[i]);
      i++;
    }
    out.push('<p>' + inline(escapeHtml(pLines.join('\n').trim())) + '</p>');
  }

  const html = out.join('\n');
  return { html, codes: [] };
}

/**
 * Sanitize HTML for safe injection into lesson notes (allow-list of tags and attributes).
 * @param {string} html - Raw HTML string
 * @returns {string} Sanitized HTML string
 * @category Utils
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  const allowedTags = new Set(['p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code', 'a', 'strong', 'em', 'b', 'i', 'span', 'div', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'hr', 'style']);
  const allowedAttrs = new Set(['href', 'src', 'alt', 'title', 'class', 'id', 'data-lesson-injected']);
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  function sanitizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const tag = node.tagName.toLowerCase();
    if (!allowedTags.has(tag)) {
      const frag = document.createDocumentFragment();
      for (const child of node.childNodeGraph) {
        const c = sanitizeNode(child);
        if (c) frag.appendChild(c);
      }
      return frag;
    }
    const out = document.createElement(tag);
    for (const a of node.attributes) {
      const name = a.name.toLowerCase();
      if (name.startsWith('on')) continue;
      if (name === 'href' || name === 'src') {
        const v = String(a.value).trim().toLowerCase();
        if (v.startsWith('javascript:')) continue;
      }
      if (allowedAttrs.has(name)) out.setAttribute(name, a.value);
    }
    for (const child of node.childNodeGraph) {
      const c = sanitizeNode(child);
      if (c) out.appendChild(c);
    }
    return out;
  }

  const fragment = document.createDocumentFragment();
  for (const child of tmp.childNodeGraph) {
    const c = sanitizeNode(child);
    if (c) fragment.appendChild(c);
  }
  const wrapper = document.createElement('div');
  wrapper.appendChild(fragment);
  return wrapper.innerHTML;
}
