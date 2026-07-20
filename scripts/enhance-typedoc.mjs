/**
 * Post-process TypeDoc HTML: inject DrawUI styles + live demo mounts from
 * docs/generated/live-demos.json (produced by generate-docs.mjs).
 *
 * Catalog-only demos (no JSDoc `@example`) are injected as orphan sections.
 * Those are syntax-highlighted with TypeDoc's highlighter so they match
 * pages that already have JSDoc examples (e.g. Code).
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const typedocDir = path.join(root, "docs/generated/typedoc");
const liveJsonPath = path.join(root, "docs/generated/live-demos.json");

const { loadHighlighter, highlight, getStyles } = await import(
  pathToFileURL(path.join(root, "node_modules/typedoc/dist/lib/utils/highlighter.js")).href
);

await loadHighlighter("light-plus", "dark-plus", ["typescript", "javascript"], []);

/**
 * Slot styles only — TypeDoc demos mount in iframes (docs/api-live.js) so
 * DrawUI's global element CSS never touches the TypeDoc host document.
 */
const LIVE_CSS = `
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
`.trim();

/**
 * TypeDoc writes filter/theme prefs via localStorage.setItem. On origins with a
 * full quota (common on github.io, shared across repos), that throw aborts
 * main.js mid-boot and leaves the page unstyled / half-initialized.
 */
const STORAGE_GUARD = `
<script data-drawui-storage-guard>
(function () {
  function isQuotaError(err) {
    return !!err && (
      err.name === "QuotaExceededError" ||
      err.code === 22 ||
      err.code === 1014
    );
  }
  function evictLarge(storage) {
    var keys = [];
    for (var i = 0; i < storage.length; i++) {
      var key = storage.key(i);
      if (key) keys.push(key);
    }
    keys.sort(function (a, b) {
      return (storage.getItem(b) || "").length - (storage.getItem(a) || "").length;
    });
    for (var j = 0; j < keys.length; j++) {
      try { storage.removeItem(keys[j]); } catch (_) {}
      if (j >= 8) break;
    }
  }
  try {
    var proto = Storage.prototype;
    var rawSet = proto.setItem;
    proto.setItem = function (key, value) {
      try {
        return rawSet.call(this, key, value);
      } catch (err) {
        if (!isQuotaError(err)) throw err;
        try {
          evictLarge(this);
          return rawSet.call(this, key, value);
        } catch (_) {
          // Prefs are non-critical — keep TypeDoc booting.
        }
      }
    };
  } catch (_) {}
})();
</script>
`.trim();

// Shared live-demos.js imports peers — always use the full bundle + peer CDNs.
function liveImportMap(assetPrefix) {
  return `{
  "imports": {
    "drawui": "${assetPrefix}dist/drawui.full.js",
    "chart.js/auto": "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/auto/+esm",
    "ag-grid-community": "https://cdn.jsdelivr.net/npm/ag-grid-community@35.2.1/dist/package/main.esm.mjs",
    "jsgantt-improved": "https://cdn.jsdelivr.net/npm/jsgantt-improved@2.8.10/+esm",
    "showdown": "https://cdn.jsdelivr.net/npm/showdown@2.1.0/+esm",
    "@highlightjs/cdn-assets/es/highlight.min.js": "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/es/highlight.min.js"
  }
}`;
}

function slugify(text, fallback) {
  const slug = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || fallback;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function assetPrefixFor(filePath) {
  // typedoc lives at docs/generated/typedoc → always need two ups to reach docs/,
  // plus one more for each nested folder (classes/, functions/, …).
  const rel = path.relative(typedocDir, path.dirname(filePath)).replace(/\\/g, "/");
  const depth = !rel || rel === "." ? 0 : rel.split("/").filter(Boolean).length;
  return `${"../".repeat(depth + 2)}`;
}

/** Highlight catalog code with TypeDoc's engine; prefix classes to avoid clashing
 *  with the page's existing hl-* scheme (indices are encounter-order dependent). */
function highlightCatalogCode(code) {
  const source = code.endsWith("\n") ? code : `${code}\n`;
  try {
    return highlight(source, "ts").replace(/\bhl-(\d+)\b/g, "dui-hl-$1");
  } catch (error) {
    console.warn("enhance-typedoc: highlight failed, falling back to plain code", error);
    return escapeHtml(code).replace(/\n/g, "<br/>");
  }
}

function catalogHighlightCss() {
  return getStyles()
    .replace(/--light-hl-/g, "--dui-light-hl-")
    .replace(/--dark-hl-/g, "--dui-dark-hl-")
    .replace(/--light-code-background/g, "--dui-light-code-background")
    .replace(/--dark-code-background/g, "--dui-dark-code-background")
    .replace(/--code-background/g, "--dui-code-background")
    .replace(/--hl-/g, "--dui-hl-")
    .replace(/\.hl-/g, ".dui-hl-")
    .replace(/\n?pre, code \{ background: var\(--dui-code-background\); \}\n?/g, "\n");
}

function injectStorageGuard(html) {
  if (html.includes("data-drawui-storage-guard")) return html;
  // Run before deferred TypeDoc main.js so Storage.prototype is patched first.
  if (html.includes('<script defer src="') || html.includes("<script defer src='")) {
    return html.replace(/<script defer src=/, `${STORAGE_GUARD}<script defer src=`);
  }
  return html.replace("<head>", `<head>${STORAGE_GUARD}`);
}

function hardenThemeBootstrap(html) {
  return html.replace(
    /document\.documentElement\.dataset\.theme\s*=\s*localStorage\.getItem\("tsd-theme"\)\s*\|\|\s*"os"/,
    'document.documentElement.dataset.theme=(function(){try{return localStorage.getItem("tsd-theme")||"os"}catch(e){return"os"}})()',
  );
}

function injectHead(html, assetPrefix, extraCss = "") {
  const map = liveImportMap(assetPrefix);
  const css = `${LIVE_CSS}${extraCss ? `\n${extraCss}` : ""}`;

  if (html.includes("data-drawui-live-assets")) {
    let next = html.replace(
      /<style data-drawui-live-assets>[\s\S]*?<\/style>/,
      `<style data-drawui-live-assets>${css}</style>`,
    );
    next = next.replace(
      /<script type="importmap">[\s\S]*?<\/script>/,
      `<script type="importmap">\n${map}\n</script>`,
    );
    return next;
  }

  const snippet = `
<style data-drawui-live-assets>${css}</style>
<script type="importmap">
${map}
</script>
`;

  return html.replace("</head>", `${snippet}</head>`);
}

function injectBodyScript(html, assetPrefix) {
  if (html.includes("data-drawui-live-runtime")) return html;
  const snippet = `<script data-drawui-live-runtime type="module" src="${assetPrefix}api-live.js"></script>`;
  return html.replace("</body>", `${snippet}</body>`);
}

function stripLiveMarkerFromExamples(html) {
  return html
    .replace(/<span class="hl-\d+">\/\/ live<\/span><br\/>/g, "")
    .replace(/^\/\/ live\n/gm, "");
}

/** Remove a previously injected catalog block (nested divs) so re-runs refresh it. */
function stripInjectedCatalog(html) {
  const open = '<div class="tsd-comment tsd-typography" data-drawui-live-catalog>';
  let result = html;
  let start = result.indexOf(open);
  while (start !== -1) {
    let depth = 0;
    let i = start;
    let end = -1;
    while (i < result.length) {
      const nextOpen = result.indexOf("<div", i);
      const nextClose = result.indexOf("</div>", i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        i = nextOpen + 4;
        continue;
      }
      depth -= 1;
      i = nextClose + 6;
      if (depth === 0) {
        end = i;
        break;
      }
    }
    if (end === -1) break;
    result = `${result.slice(0, start)}${result.slice(end)}`;
    start = result.indexOf(open);
  }
  return result;
}

function renderOrphanDemoSection(demos) {
  const blocks = demos
    .map((demo, index) => {
      const slug = slugify(demo.caption, String(index));
      const title = demo.caption ? `Example: ${escapeHtml(demo.caption)}` : "Example";
      const codeHtml = highlightCatalogCode(demo.code);
      return `<div class="tsd-tag-example" data-drawui-live-section>
<h4 class="tsd-anchor-link" id="example-${slug}">${title}<a href="#example-${slug}" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="../assets/icons.svg#icon-anchor"></use></svg></a></h4>
<pre><code class="ts">${codeHtml}</code></pre>
<div class="doc-live-demo" data-live-demo="${demo.id}" aria-label="Live preview"></div>
</div>`;
    })
    .join("\n");

  return `<div class="tsd-comment tsd-typography" data-drawui-live-catalog>${blocks}</div>`;
}

function injectDemoMounts(html, demos) {
  let result = stripInjectedCatalog(stripLiveMarkerFromExamples(html));
  let injected = 0;

  for (let i = 0; i < demos.length; i += 1) {
    const demo = demos[i];
    const slug = slugify(demo.caption, String(i));
    const headingId = `example-${slug}`;
    const mount = `<div class="doc-live-demo" data-live-demo="${demo.id}" aria-label="Live preview"></div>`;

    if (result.includes(`data-live-demo="${demo.id}"`)) continue;

    const byId = new RegExp(
      `(<div class="tsd-tag-example">\\s*<h4 class="tsd-anchor-link" id="${headingId}"[\\s\\S]*?</pre>)(\\s*</div>)`,
      "i",
    );

    if (byId.test(result)) {
      result = result.replace(byId, `$1${mount}$2`);
      injected += 1;
    }
  }

  // Fallback: append mounts after each existing tsd-tag-example in order.
  if (injected < demos.length) {
    const remaining = demos.filter((demo) => !result.includes(`data-live-demo="${demo.id}"`));
    let demoIndex = 0;
    result = result.replace(
      /(<div class="tsd-tag-example">[\s\S]*?<\/pre>)(\s*<\/div>)/g,
      (match, before, after) => {
        if (demoIndex >= remaining.length) return match;
        if (match.includes("data-live-demo=")) return match;
        const demo = remaining[demoIndex];
        demoIndex += 1;
        injected += 1;
        return `${before}<div class="doc-live-demo" data-live-demo="${demo.id}" aria-label="Live preview"></div>${after}`;
      },
    );
  }

  // Catalog-only demos: inject a live section after the class comment when no mount yet.
  const stillMissing = demos.filter((demo) => !result.includes(`data-live-demo="${demo.id}"`));
  if (stillMissing.length) {
    const section = renderOrphanDemoSection(stillMissing);
    const commentEnd =
      /(<section class="tsd-panel tsd-comment">[\s\S]*?<\/section>)(\s*<section class="tsd-panel tsd-hierarchy")/;
    if (commentEnd.test(result)) {
      result = result.replace(commentEnd, `$1${section}$2`);
      injected += stillMissing.length;
    } else {
      const titleEnd = /(<\/div>\s*<section class="tsd-panel tsd-comment">)/;
      if (titleEnd.test(result)) {
        result = result.replace(titleEnd, `${section}$1`);
        injected += stillMissing.length;
      } else {
        result = result.replace(
          /(<div class="col-content">)/,
          `$1${section}`,
        );
        injected += stillMissing.length;
      }
    }
  }

  return {
    html: result,
    injected,
    hasCatalog: result.includes("data-drawui-live-catalog"),
  };
}

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listHtmlFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

let liveBySymbol;
try {
  liveBySymbol = JSON.parse(await readFile(liveJsonPath, "utf8"));
} catch {
  console.warn("enhance-typedoc: no live-demos.json — run docs:index first");
  liveBySymbol = {};
}

const htmlFiles = await listHtmlFiles(typedocDir);
const pending = [];
let storageGuarded = 0;

// Always harden every TypeDoc page (storage guard), even without live demos.
for (const file of htmlFiles) {
  let html = await readFile(file, "utf8");
  const before = html;
  html = injectStorageGuard(html);
  html = hardenThemeBootstrap(html);

  const base = path.basename(file, ".html");
  const demos = liveBySymbol[base];
  if (demos?.length) {
    const assetPrefix = assetPrefixFor(file);
    const { html: withMounts, injected, hasCatalog } = injectDemoMounts(html, demos);
    pending.push({ file, assetPrefix, html: withMounts, injected, hasCatalog });
    continue;
  }

  if (html !== before) {
    await writeFile(file, html, "utf8");
    storageGuarded += 1;
  }
}

// Build catalog highlight CSS after all orphan snippets have been tokenized
// (scheme indices are assigned in encounter order).
const catalogCss = pending.some((p) => p.hasCatalog) ? catalogHighlightCss() : "";

let pagesTouched = 0;
let mountsInjected = 0;

for (const item of pending) {
  let html = injectStorageGuard(item.html);
  html = hardenThemeBootstrap(html);
  html = injectHead(html, item.assetPrefix, item.hasCatalog ? catalogCss : "");
  html = injectBodyScript(html, item.assetPrefix);

  if (item.injected > 0 || html.includes("data-drawui-live-assets") || html.includes("data-drawui-storage-guard")) {
    await writeFile(item.file, html, "utf8");
    pagesTouched += 1;
    mountsInjected += item.injected;
  }
}

console.log(
  `enhance-typedoc: updated ${pagesTouched} TypeDoc pages (${mountsInjected} live mounts); storage-guard on ${storageGuarded + pagesTouched} pages`,
);
