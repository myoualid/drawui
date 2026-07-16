# DrawUI examples

Static browser demos for the dual `dist/` build. No bundler required — only a local HTTP server (ES modules do not load over `file://`).

Example pages link `examples/examples.css` after DrawUI CSS to re-enable document scrolling (DrawUI’s reset locks `html`/`body` to `overflow: hidden` for full-viewport apps).

## Run locally

Build first, then serve the `docs/` folder:

```powershell
npm run build
npx --yes serve docs -p 5173
```

Or use the combined script:

```powershell
npm run examples
```

Then open:

- **Landing page:** http://localhost:5173/
- **Min (no peer deps):** http://localhost:5173/examples/min/
- **Min component gallery:** http://localhost:5173/examples/components/
- **Full component gallery:** http://localhost:5173/examples/components/full.html

For GitHub Pages, set the site source to the `/docs` folder — [`index.html`](../index.html) is the entry.

> Previously at `/examples/min-components/` — that folder was renamed to `components/`.

## Min example

[`min/index.html`](./min/index.html) loads the bundled min build:

```html
<link rel="stylesheet" href="../../dist/drawui.min.css">
<script type="importmap">
{ "imports": { "drawui": "../../dist/drawui.min.js" } }
</script>
```

No peer packages. Theme CSS (`styles/themes/*.css`) is still linked separately.

After npm publish, swap the paths for CDN URLs:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/drawui@0.1.0/dist/drawui.min.css">
<script type="module">
  import { DrawUI } from "https://cdn.jsdelivr.net/npm/drawui@0.1.0/dist/drawui.min.js";
</script>
```

## Component gallery

[`components/`](./components/) is a **single-page app** built with `DrawUI.spa()` — sidebar navigation, hash routing, and one component preview at a time.

| Entry | Build | Peers |
| --- | --- | --- |
| [`index.html`](./components/index.html) | `dist/drawui.min.js` + `dist/drawui.min.css` | None |
| [`full.html`](./components/full.html) | `dist/drawui.full.js` + `dist/drawui.full.css` + peer import map | chart.js, ag-grid, jsgantt, showdown, highlight.js |

Regenerate the catalog after changing exports or categories:

```powershell
npm run build:catalog
```

Then open http://localhost:5173/examples/components/ (min) or http://localhost:5173/examples/components/full.html (full).

**Source files:**

| File | Role |
| --- | --- |
| `catalog.manifest.json` | Human-edited categories, peer category, and demo assignments |
| `catalog.json` | Generated at build — fed to the gallery at runtime |
| `demos.js` | Min preview renderers keyed by demo id |
| `demos.full.js` | Peer-dependent preview renderers (chart, spreadsheet, gantt, Showdown markdown) |
| `gallery.js` | Wires catalog into `DrawUI.spa()`; accepts `{ build: "min" \| "full" }` |
| `../spa-host.css` | Full-viewport host styles for SPA examples |

## Full peer import map

[`full.html`](./components/full.html) maps `drawui` to `dist/drawui.full.js`, `drawui/overlays` to `dist/drawui.overlays.js`, and pins peers to jsDelivr:

- `chart.js@4.4.7`
- `ag-grid-community@35.2.1`
- `jsgantt-improved@2.8.10`
- `showdown@2.1.0`
- `@highlightjs/cdn-assets@11.11.1`

See [PUBLISHING.md](../PUBLISHING.md) and `docs/dist/importmap.full.json` for the complete import map template.
