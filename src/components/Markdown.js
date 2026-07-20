import { simpleMarkdownToHtml, sanitizeHtml } from "../utils/markdown.js";
import { Container } from "../primitives/ui.js";

/**
 * Convert markdown source to HTML using the built-in converter.
 * @param {string} markdown
 * @returns {{ html: string, codes: any[] }}
 * @category Text
 */
export function markdownToHtml(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return { html: "", codes: [] };
  }

  const { html } = simpleMarkdownToHtml(markdown);
  return { html, codes: [] };
}

/**
 * Renders markdown (or sanitized HTML) into a `.Markdown` container.
 * Min build uses the built-in converter. Full build exports a Showdown-backed
 * `Markdown` with the same API when peers are loaded.
 *
 * @example
 * // live
 * return new Markdown("## Hello\n\n**Bold** text and `code`.");
 *
 * @param {string} [text='']
 * @param {Object} [options={}]
 * @param {boolean} [options.isMarkdown] Force markdown (`true`) or HTML (`false`) interpretation.
 * @category Text
 */
export class Markdown extends Container {
  constructor(text = "", options = {}) {
    super();

    this._options = options;
    this.addClass("Markdown");

    if (text) {
      this.setContent(text, options);
    }
  }

  /**
   * @param {string} text
   * @param {Object} [options]
   * @param {boolean} [options.isMarkdown]
   */
  setContent(text, options = this._options) {
    const raw = String(text).trim();
    const explicitMarkdown = options?.isMarkdown === true;
    const explicitHtml = options?.isMarkdown === false;
    const looksLikeHtml = raw.startsWith("<");
    const isMarkdown = explicitMarkdown || (!explicitHtml && !looksLikeHtml);

    if (isMarkdown) {
      this.setMarkdown(text);
      return this;
    }

    this.setInnerHTML(sanitizeHtml(text));
    return this;
  }

  setMarkdown(text) {
    const { html } = markdownToHtml(text);
    this.setInnerHTML(html);
    return this;
  }
}
