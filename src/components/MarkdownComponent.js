import showdownModule from "showdown";

import { UIDiv } from "../primitives/ui.js";
import { escapeHtml } from "../utils/escape-html.js";

let highlightJsPromise;

const showdownApi = showdownModule?.default ?? showdownModule;

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

const converter = typeof showdownApi?.Converter === "function"
  ? new showdownApi.Converter(SHOWDOWN_OPTIONS)
  : null;


function loadHighlightJs() {
  highlightJsPromise ??= import("@highlightjs/cdn-assets/es/highlight.min.js")
    .then((module) => module.default ?? module)
    .catch((error) => {
      console.warn("[MarkdownComponent] Highlight.js unavailable; code blocks will not be highlighted.", error);
      return null;
    });

  return highlightJsPromise;
}

export function markdownToHtml(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return { html: "", codes: [] };
  }

  if (!converter) {
    console.warn("[MarkdownComponent] Showdown unavailable; returning raw text.");

    return { html: `<pre>${escapeHtml(markdown)}</pre>`, codes: [] };
  }

  return { html: converter.makeHtml(markdown), codes: [] };
}

export class MarkdownComponent extends UIDiv {
  constructor(text = "", options = {}) {
    super();

    this._options = options;
    this._highlightRequestId = 0;

    this.addClass("Markdown");

    if (text) {
      this.setMarkdown(text);
    }
  }

  setMarkdown(text) {
    const { html } = markdownToHtml(text);

    this.setInnerHTML(html);

    this.#highlightCodeBlocks();
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