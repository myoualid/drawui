# Publishing and distribution

IfcOpenShell GUI ships as source ESM plus bundled browser builds under `docs/dist/`. This page covers npm packaging, GitHub Pages, and CDN-style consumption.

## Package contents

The npm package name is `ifcopenshell-gui`. Install it with `npm install ifcopenshell-gui`. Application code imports `ifcopenshell/gui` and `ifcopenshell/layout`. An import map points those specifiers at this package, so they stay off the existing `ifcopenshell` package.

The package includes:

- `src/` — ESM source entrypoints
- `dist/` — browser bundles: `gui.js`, `layout.js`, and matching CSS
- `styles/` — `gui.css`, `layout.css`, `peers.css`, and the layers they import
- `types/index.d.ts` — TypeScript declarations

The docs site stays in the repository. It is not part of the npm tarball.

## Entrypoints

Map the public specifiers onto the installed package, then import them:

```html
<script type="importmap">
{
  "imports": {
    "ifcopenshell/gui": "./node_modules/ifcopenshell-gui/dist/gui.js",
    "ifcopenshell/layout": "./node_modules/ifcopenshell-gui/dist/layout.js"
  }
}
</script>
```

```js
import { Button, Chart } from "ifcopenshell/gui";
import { World, Layout, Panel } from "ifcopenshell/layout";
import "ifcopenshell-gui/styles/gui.css";
import "ifcopenshell-gui/styles/layout.css";
```

A bundler can alias the same specifiers to the package exports `ifcopenshell-gui/gui` and `ifcopenshell-gui/layout`, which are the source barrels.

Or load the built bundles:

- UI: `dist/gui.js` + `dist/gui.css` (components and peer widgets)
- Layout: `dist/layout.js` + `dist/layout.css`

See the generated [component index](./ai/component-index.html) for the full export inventory.

## Builds

| Script | Output |
| --- | --- |
| `npm run build` | `dist/gui.js`, `dist/layout.js`, matching CSS, import map |
| `npm run build:catalog` | `docs/examples/components/catalog.json` |
| `npm run docs` | `docs/generated/` reference pages + TypeDoc HTML |

Run `npm run build` before serving examples or publishing docs assets.

## Publish to npm

`.github/workflows/publish.yml` builds the package and publishes it when you run **Publish to npm** from the Actions tab. It does not run on push.

Before the first run:

1. Create an npm granular access token that can publish `ifcopenshell-gui` (or an automation token).
2. Add that token to the GitHub repository as the secret `NPM_TOKEN`.
3. Bump `version` in `package.json`. npm rejects a version that is already on the registry.

The workflow runs `npm ci`, `npm run build`, then `npm publish --access public --provenance`. Provenance uses GitHub's OIDC token (`id-token: write`). You can also configure [trusted publishing](https://docs.npmjs.com/trusted-publishers) for this repository and workflow on npmjs.com; `NPM_TOKEN` is still required until that trust is in place.

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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ifcopenshell-gui@0.2.0/dist/gui.css">
<script type="module">
  import { Button } from "https://cdn.jsdelivr.net/npm/ifcopenshell-gui@0.2.0/dist/gui.js";
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
