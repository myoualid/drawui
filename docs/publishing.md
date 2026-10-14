# Publishing and distribution

aeco-dev GUI publishes the browser build. This page covers npm packaging, GitHub Pages, and CDN-style consumption.

## Package contents

The library publishes as two public packages:

- `@aeco-dev/gui` — `gui.js`, `gui.css`, `importmap.full.json`, `index.d.ts`, `SKILL.md`, and `aeco-dev-gui.json`
- `@aeco-dev/layout` — `layout.js`, `layout.css`, and `index.d.ts`

```sh
npm install @aeco-dev/gui @aeco-dev/layout
```

`@aeco-dev/layout` depends on `@aeco-dev/gui`. A bundler imports the package names directly. A page without a bundler maps them onto `node_modules/@aeco-dev/gui/gui.js` and `node_modules/@aeco-dev/layout/layout.js`.

Source, style layers, and font files stay in the repository. The docs site stays in the repository. Neither is part of the npm tarballs.

## Entrypoints

Map the public specifiers onto the installed package, then import them:

```html
<script type="importmap">
{
  "imports": {
    "@aeco-dev/gui": "./node_modules/@aeco-dev/gui/gui.js",
    "@aeco-dev/layout": "./node_modules/@aeco-dev/layout/layout.js"
  }
}
</script>
```

```js
import { Button, Chart } from "@aeco-dev/gui";
import { World, Layout, Panel } from "@aeco-dev/layout";
import "@aeco-dev/gui/gui.css";
import "@aeco-dev/layout/layout.css";
```

A bundler imports `@aeco-dev/gui` and `@aeco-dev/layout` directly. Those entry points are the browser bundles.

Or load the built files from the installed packages:

- UI: `@aeco-dev/gui` and `@aeco-dev/gui/gui.css`
- Layout: `@aeco-dev/layout` and `@aeco-dev/layout/layout.css`

See the generated [component index](./ai/component-index.html) for the full export inventory.

## Builds

| Script | Output |
| --- | --- |
| `npm run build` | `dist/gui.js`, `dist/layout.js`, matching CSS, import map, `SKILL.md`, `aeco-dev-gui.json` |
| `npm run build:catalog` | `docs/examples/components/catalog.json` |
| `npm run docs` | `docs/generated/` reference pages + TypeDoc HTML |

Run `npm run build` before serving examples or publishing docs assets.

## Publish to npm

`.github/workflows/publish.yml` builds the packages and publishes `@aeco-dev/gui`, then `@aeco-dev/layout`, when you run **Publish to npm** from the Actions tab. It does not run on push.

Before the first run:

1. Create an npm granular access token that can publish `@aeco-dev/gui` and `@aeco-dev/layout`.
2. Add that token to the GitHub repository as the secret `NPM_TOKEN`.
3. Bump `version` in `packages/gui/package.json` and `packages/layout/package.json`, and set `@aeco-dev/layout`'s dependency on `@aeco-dev/gui` to that same version. npm rejects a version that is already on the registry.

The workflow runs `npm ci`, `npm run build`, then publishes each workspace with `--access public --provenance`. Provenance uses GitHub's OIDC token (`id-token: write`). You can also configure [trusted publishing](https://docs.npmjs.com/trusted-publishers) for this repository and workflow on npmjs.com; `NPM_TOKEN` is still required until that trust is in place.

## GitHub Pages

Set the site source to the `/docs` folder. The landing page is [`index.html`](./index.html).

Local preview:

```powershell
npm run examples
```

Then open http://localhost:5173/

## Full peer import map

The GUI bundle (`gui.js`) externalizes peer dependencies. Browser demos load peers from jsDelivr using [`docs/dist/importmap.full.json`](./dist/importmap.full.json):

- `chart.js`
- `ag-grid-community`
- `jsgantt-improved`
- `showdown`
- `@highlightjs/cdn-assets`

Example (`full.html` pattern):

```html
<link rel="stylesheet" href="../../dist/gui.css">
<link rel="stylesheet" href="../../dist/gui.css">
<script type="importmap" src="../../dist/importmap.full.json"></script>
```

After npm publish, swap paths for CDN URLs:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@aeco-dev/gui@0.2.1/gui.css">
<script type="module">
  import { Button } from "https://cdn.jsdelivr.net/npm/@aeco-dev/gui@0.2.1/gui.js";
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
