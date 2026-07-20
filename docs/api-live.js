/**
 * Mounts JSDoc `@example` live demos on generated API / TypeDoc pages.
 * Demo builders come from `scripts/generate-docs.mjs` (gallery demos.js + JSDoc `// live` fallbacks).
 *
 * Registry API pages (`docs/generated/api/`) already load DrawUI CSS as the page
 * chrome, so demos mount in the light DOM.
 *
 * TypeDoc pages keep their own theme (CSS @layer). Injecting DrawUI's bare
 * element rules (`button`, `input`, `a`, `label`, `header`, …) into that
 * document fights the host chrome. On TypeDoc we therefore mount each demo
 * inside a same-origin iframe that loads DrawUI CSS in isolation.
 */
import { LIVE_DEMOS } from "./generated/live-demos.js";

const FONT_HREFS = [
  "https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;500;600;700;800&display=swap",
  "https://fonts.googleapis.com/css2?family=Inconsolata:wght@200;300;400;500;600;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap",
];

const RESIZE_MSG = "drawui-live-resize";

const FRAME_HOST_CSS = `
.doc-live-demo {
  display: block;
  margin: 0.75rem 0 1.25rem;
  padding: 0;
  border: 0;
  background: transparent;
  min-height: 1px;
}
.doc-live-demo-frame {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
  color-scheme: dark;
  overflow: hidden;
  min-height: 1px;
}
.dui-live-error {
  color: #e88;
  font-size: 0.875rem;
  font-family: ui-monospace, Consolas, monospace;
}
`;

function isTypeDocHost() {
  return document.documentElement.classList.contains("default");
}

function resolveDrawuiUrls() {
  // Match the importmap when present; default to full (live-demos imports peers).
  let cssName = "drawui.full.css";
  let jsName = "drawui.full.js";
  for (const script of document.querySelectorAll('script[type="importmap"]')) {
    try {
      const map = JSON.parse(script.textContent);
      const mapped = map?.imports?.drawui;
      if (typeof mapped === "string" && mapped.includes("drawui.min")) {
        cssName = "drawui.min.css";
        jsName = "drawui.min.js";
        break;
      }
      if (typeof mapped === "string" && mapped.includes("drawui.full")) {
        cssName = "drawui.full.css";
        jsName = "drawui.full.js";
        break;
      }
    } catch {
      // ignore malformed import maps
    }
  }
  return {
    cssUrl: new URL(`./dist/${cssName}`, import.meta.url).href,
    jsUrl: new URL(`./dist/${jsName}`, import.meta.url).href,
    liveDemosUrl: new URL("./generated/live-demos.js", import.meta.url).href,
  };
}

function peerImportMap(jsUrl) {
  return {
    imports: {
      drawui: jsUrl,
      "chart.js/auto": "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/auto/+esm",
      "ag-grid-community":
        "https://cdn.jsdelivr.net/npm/ag-grid-community@35.2.1/dist/package/main.esm.mjs",
      "jsgantt-improved": "https://cdn.jsdelivr.net/npm/jsgantt-improved@2.8.10/+esm",
      showdown: "https://cdn.jsdelivr.net/npm/showdown@2.1.0/+esm",
      "@highlightjs/cdn-assets/es/highlight.min.js":
        "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/es/highlight.min.js",
    },
  };
}

function ensureDocumentFonts() {
  for (const href of FONT_HREFS) {
    if (document.querySelector(`link[data-drawui-live-font][href="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.drawuiLiveFont = "";
    document.head.appendChild(link);
  }
}

function ensureDocumentStyles() {
  ensureDocumentFonts();
  const { cssUrl } = resolveDrawuiUrls();

  let link = document.querySelector("link[data-drawui-live-css]");
  if (!link) {
    link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.drawuiLiveCss = "";
    document.head.appendChild(link);
  }
  link.href = cssUrl;
}

function ensureFrameHostStyles() {
  if (document.querySelector("style[data-drawui-live-frame-host]")) return;
  const style = document.createElement("style");
  style.dataset.drawuiLiveFrameHost = "";
  style.textContent = FRAME_HOST_CSS;
  document.head.appendChild(style);
}

function toDom(result) {
  if (!result) return null;
  if (result instanceof Node) return result;
  if (result.dom instanceof Node) return result.dom;
  if (result.panel?.dom instanceof Node) return result.panel.dom;
  if (result.panel instanceof Node) return result.panel;
  if (result.container?.dom instanceof Node) return result.container.dom;
  if (result.container instanceof Node) return result.container;
  return null;
}

function mountDemo(host, child, { error = false } = {}) {
  host.replaceChildren();

  if (error || typeof child === "string") {
    const err = document.createElement("div");
    err.className = "dui-live-error";
    err.textContent = typeof child === "string" ? child : String(child);
    host.appendChild(err);
    return;
  }

  host.appendChild(child);
}

function buildFrameSrcdoc(demoId) {
  const { cssUrl, jsUrl, liveDemosUrl } = resolveDrawuiUrls();
  const importMap = JSON.stringify(peerImportMap(jsUrl), null, 2);
  const fontLinks = FONT_HREFS.map(
    (href) => `<link rel="stylesheet" href="${href}">`,
  ).join("\n");
  const safeId = JSON.stringify(demoId);

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${fontLinks}
<link rel="stylesheet" href="${cssUrl}">
<style>
  html {
    color-scheme: dark;
    background: transparent;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: transparent !important;
    overflow: hidden;
    color: var(--dui-color-text, #eeeeec);
    font-family: var(--dui-font-ui, Nunito, sans-serif);
  }
  #root {
    display: block;
    width: fit-content;
    max-width: 100%;
    box-sizing: border-box;
  }
  .dui-live-error {
    color: #e88;
    font-size: 0.875rem;
    font-family: ui-monospace, Consolas, monospace;
  }
</style>
<script type="importmap">
${importMap}
</script>
</head>
<body>
<div id="root"></div>
<script type="module">
import { LIVE_DEMOS } from ${JSON.stringify(liveDemosUrl)};

const demoId = ${safeId};
const root = document.getElementById("root");
const MSG = ${JSON.stringify(RESIZE_MSG)};

function toDom(result) {
  if (!result) return null;
  if (result instanceof Node) return result;
  if (result.dom instanceof Node) return result.dom;
  if (result.panel?.dom instanceof Node) return result.panel.dom;
  if (result.panel instanceof Node) return result.panel;
  if (result.container?.dom instanceof Node) return result.container.dom;
  if (result.container instanceof Node) return result.container;
  return null;
}

function reportHeight() {
  const height = Math.ceil(
    Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      root.scrollHeight,
      root.getBoundingClientRect().height,
    ),
  );
  parent.postMessage({ type: MSG, id: demoId, height }, "*");
}

function showError(message) {
  root.replaceChildren();
  const err = document.createElement("div");
  err.className = "dui-live-error";
  err.textContent = message;
  root.appendChild(err);
  reportHeight();
}

const builder = LIVE_DEMOS[demoId];
if (!builder) {
  showError("Missing live demo: " + demoId);
} else {
  try {
    const result = builder();
    const node = toDom(result);
    if (!node) {
      showError("Demo did not return a Control or DOM node.");
    } else {
      root.replaceChildren(node);
      if (result && typeof result.init === "function") {
        queueMicrotask(() => {
          try {
            result.init();
          } catch (error) {
            console.error("[api-live] " + demoId + " init()", error);
          }
          reportHeight();
        });
      }
    }
  } catch (error) {
    showError("Demo failed: " + (error && error.message ? error.message : error));
    console.error("[api-live] " + demoId, error);
  }
}

reportHeight();
requestAnimationFrame(reportHeight);
setTimeout(reportHeight, 100);
setTimeout(reportHeight, 400);

if (typeof ResizeObserver !== "undefined") {
  const ro = new ResizeObserver(() => reportHeight());
  ro.observe(root);
  ro.observe(document.body);
}
</script>
</body>
</html>`;
}

function ensureResizeListener() {
  if (window.__drawuiLiveResizeBound) return;
  window.__drawuiLiveResizeBound = true;
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.type !== RESIZE_MSG || typeof data.height !== "number") return;
    const frame = [...document.querySelectorAll("iframe.doc-live-demo-frame")].find(
      (el) => el.getAttribute("data-live-demo") === data.id,
    );
    if (!frame) return;
    const next = Math.max(1, Math.ceil(data.height));
    if (frame._drawuiHeight === next) return;
    frame._drawuiHeight = next;
    frame.style.height = `${next}px`;
  });
}

function mountDemoInIframe(host, demoId) {
  host.replaceChildren();
  const frame = document.createElement("iframe");
  frame.className = "doc-live-demo-frame";
  frame.setAttribute("data-live-demo", demoId);
  frame.setAttribute("title", `Live preview: ${demoId}`);
  frame.setAttribute("loading", "lazy");
  frame.setAttribute("allowtransparency", "true");
  frame.setAttribute(
    "sandbox",
    "allow-scripts allow-same-origin allow-forms allow-popups",
  );
  frame.style.backgroundColor = "transparent";
  frame.srcdoc = buildFrameSrcdoc(demoId);
  host.appendChild(frame);
}

function mountLightDomDemo(host, id) {
  const builder = LIVE_DEMOS[id];
  if (!builder) {
    mountDemo(host, `Missing live demo: ${id}`, { error: true });
    return;
  }

  try {
    const result = builder();
    const node = toDom(result);
    if (!node) {
      mountDemo(host, "Demo did not return a Control or DOM node.", { error: true });
      return;
    }
    mountDemo(host, node);
    if (result && typeof result.init === "function") {
      queueMicrotask(() => {
        try {
          result.init();
        } catch (error) {
          console.error(`[api-live] ${id} init()`, error);
        }
      });
    }
  } catch (error) {
    mountDemo(host, `Demo failed: ${error.message}`, { error: true });
    console.error(`[api-live] ${id}`, error);
  }
}

function mountLiveDemos() {
  const typedoc = isTypeDocHost();

  if (typedoc) {
    ensureFrameHostStyles();
    ensureResizeListener();
  } else {
    ensureDocumentStyles();
  }

  for (const host of document.querySelectorAll("[data-live-demo]")) {
    if (host.dataset.liveMounted === "1") continue;
    host.dataset.liveMounted = "1";

    const id = host.getAttribute("data-live-demo");
    if (!id) continue;

    if (typedoc) {
      mountDemoInIframe(host, id);
    } else {
      mountLightDomDemo(host, id);
    }
  }
}

mountLiveDemos();
