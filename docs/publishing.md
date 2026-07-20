# Publishing and distribution

DrawUI ships as source ESM plus bundled browser builds under `docs/dist/`. This page covers npm packaging, GitHub Pages, and CDN-style consumption.

## Package contents

The published npm package includes:

- `src/` — ESM source entrypoints
- `styles/` — public CSS entrypoints (`core.css`, `tokens.css`, themes, etc.)
- `types/index.d.ts` — TypeScript declarations
- `docs/` — examples, generated reference, and GitHub Pages assets

## Entrypoints

Import from the package entry and CSS subpaths:

```js
import { DrawUI, FloatingWindow, Button, RadialMenu } from "drawui";
import "drawui/styles/core.css";
import "drawui/styles/icons.css";
```

See the generated [component index](./ai/component-index.html) for the full export inventory.

## Builds

| Script | Output |
| --- | --- |
| `npm run build` | `docs/dist/drawui.min.js`, `drawui.full.js`, CSS bundles, import map |
| `npm run build:catalog` | `docs/examples/components/catalog.json` |
| `npm run docs` | `docs/generated/` reference pages + TypeDoc HTML |

Run `npm run build` before serving examples or publishing docs assets.

## GitHub Pages

Set the site source to the `/docs` folder. The landing page is [`index.html`](./index.html).

Local preview:

```powershell
npm run examples
```

Then open http://localhost:5173/

## Full peer import map

The full build (`drawui.full.js`) externalizes peer dependencies. Browser demos load peers from jsDelivr using [`docs/dist/importmap.full.json`](./dist/importmap.full.json):

- `chart.js`
- `ag-grid-community`
- `jsgantt-improved`
- `showdown`
- `@highlightjs/cdn-assets`

Example (`full.html` pattern):

```html
<link rel="stylesheet" href="../../dist/drawui.full.css">
<script type="importmap" src="../../dist/importmap.full.json"></script>
<script type="importmap">
{
  "imports": {
    "drawui": "../../dist/drawui.full.js"
  }
}
</script>
```

After npm publish, swap paths for CDN URLs:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/drawui@0.2.0/dist/drawui.min.css">
<script type="module">
  import { DrawUI } from "https://cdn.jsdelivr.net/npm/drawui@0.2.0/dist/drawui.min.js";
</script>
```

## Local vendor sync

During development, `npm run build` can copy `docs/dist/*` and `types/index.d.ts` to a local vendor directory when `scripts/local-vendor.mjs` exists (see `scripts/local-vendor.example.mjs`).

## Documentation workflow

1. Edit API metadata in `src/api/registry.json` (status, entrypoints, emitted classes, notes).
2. Add or update JSDoc on source exports where method-level detail is needed.
3. Run `npm run docs` to regenerate markdown sources and browser-ready `.html` pages under `docs/`.
4. Run `npm run check:docs` in CI to ensure generated output is up to date.

Manual docs (not generated):

- [Styling guide](./styling.html)
- [Getting started](./getting-started.html)
- [AI usage guide](./ai/SKILL.html)
