# Generated documentation

This folder is produced by `npm run docs`. Do not edit files here by hand.

| Output | Source |
| --- | --- |
| `api/*.{md,html}` | `src/api/registry.json` + JSDoc in `src/` + gallery demos |
| `live-demos.js` + `.json` | `docs/examples/components/demos.js` (+ `demos.full.js`) via `catalog.manifest.json`; JSDoc `// live` only when no gallery demo |
| `typedoc/` | JSDoc in `src/` (TypeDoc) + live preview injection |
| `../ai/component-index.*` | `src/api/registry.json` (AI retrieval folder) |
| `../getting-started.html`, etc. | Hand-written guides in `docs/*.md` |

## Authoring live examples

**One source of truth:** edit `docs/examples/components/demos.js` (or `demos.full.js` for peers)
and wire the demo id in `catalog.manifest.json`. `npm run docs` copies those into API /
TypeDoc pages.

For symbols without a gallery demo (helpers, shell notes), add a JSDoc `@example` with
`// live` on the source declaration:

```js
/**
 * @example <caption>Basic</caption>
 * // live
 * return new Disclaimer("See docs/examples/templates.");
 * @category Shell
 */
```

To regenerate:

```powershell
npm run docs
```

Manual documentation lives alongside this folder:

- [Docs hub](../index.html) — TypeDoc, AI Documentation, Developer guides
- [Getting started](../getting-started.html)
- [Styling](../styling.html)
- [Publishing](../publishing.html)
- [AI docs](../ai/) — component index + usage guide
