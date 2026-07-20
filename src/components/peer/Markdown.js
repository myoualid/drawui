import { simpleMarkdownToHtml, sanitizeHtml } from "../../utils/markdown.js";
import { Container } from "../../primitives/ui.js";

let highlightJsPromise;
let converter;
let converterPromise;

const SHOWDOWN_OPTIONS = {
  tables: true,
  tasklists: true,
  strikethrough: true,
  ghCodeBlocks: true,
  simplifiedAutoLink: true,
  openLinksInNewWindow: true,
  emoji: true,
  underline: true,
  ghCompatibleHeaderId: true,
  parseImgDimensions: true,
  headerLevelStart: 1,
};

/** @category Text */
function ensureConverter() {
  converterPromise ??= import("showdown")
    .then((module) => {
      const showdownApi = module.default ?? module;

      if (typeof showdownApi?.Converter !== "function") {
        console.warn("[Markdown] Showdown unavailable; using built-in markdown converter.");
        return null;
      }

      converter = new showdownApi.Converter(SHOWDOWN_OPTIONS);
      return converter;
    })
    .catch((error) => {
      console.warn("[Markdown] Showdown failed to load; using built-in markdown converter.", error);
      return null;
    });

  return converterPromise;
}

/** @category Text */
function loadHighlightJs() {
  highlightJsPromise ??= import("@highlightjs/cdn-assets/es/highlight.min.js")
    .then((module) => module.default ?? module)
    .catch((error) => {
      console.warn("[Markdown] Highlight.js unavailable; code blocks will not be highlighted.", error);
      return null;
    });

  return highlightJsPromise;
}

/**
 * Convert markdown source to HTML.
 * Uses Showdown when available; otherwise the built-in converter.
 * @param {string} markdown
 * @returns {{ html: string, codes: any[] }}
 * @category Text
 */
export function markdownToHtml(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return { html: "", codes: [] };
  }

  if (converter) {
    return { html: converter.makeHtml(markdown), codes: [] };
  }

  void ensureConverter();

  const { html } = simpleMarkdownToHtml(markdown);
  return { html, codes: [] };
}

/**
 * Showdown-backed markdown renderer (full build). Same API as the min-build `Markdown`.
 *
 * @example
 * // live
 * return new Markdown("## Hello\n\n**Bold** text and `code`.");
 *
 * @param {string} [text='']
 * @param {Object} [options={}]
 * @param {boolean} [options.isMarkdown]
 * @param {Function} [options.highlightCallback]
 * @category Text
 */
export class Markdown extends Container {
  constructor(text = "", options = {}) {
    super();

    this._options = options;
    this._highlightRequestId = 0;

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

    this.#highlightCodeBlocks();
    return this;
  }

  async #highlightCodeBlocks() {
    const highlightCallback = this._options?.highlightCallback;
    const blocks = Array.from(this.dom.querySelectorAll("pre code"));

    if (!blocks.length) {
      return;
    }

    const requestId = ++this._highlightRequestId;

    if (typeof highlightCallback === "function") {
      highlightCallback(blocks, this);
      return;
    }

    const highlightJs = await loadHighlightJs();

    if (!highlightJs || requestId !== this._highlightRequestId) {
      return;
    }

    blocks.forEach((block) => {
      highlightJs.highlightElement(block);
    });
  }
}
