# DrawUI.js

DrawUI.js is a framework-free ESM UI library for DOM-native tools, panels, overlays, and form controls. The public package surface is stable under `drawui`, `drawui/primitives`, `drawui/components`, `drawui/layout`, `drawui/overlays`, and `drawui/utils/*`, with CSS entrypoints under `drawui/styles/*`.

This README is the package guide. Detailed reference material lives in `docs/`:

- [Getting started](docs/getting-started.md)
- [Component index](docs/component-index.md)
- [Styling guide](docs/styling.md)
- [AI usage guide](docs/ai-usage.md)
- [Live examples](docs/index.html) (GitHub Pages landing page)

## Install

```json
{
	"dependencies": {
		"drawui": "file:./drawUI"
	}
}
```

DrawUI ships source ESM, so use a bundler or runtime that understands ES modules and CSS imports.

## Quick Start

```js
import { DrawUI, FloatingPanel } from "drawui";
import "drawui/styles/core.css";
import "drawui/styles/icons.css";
import "drawui/styles/themes/dark.css";

const panel = new FloatingPanel({
	title: "Inspector",
	position: "right",
	width: "320px"
});

panel.content.add(
	DrawUI.column()
		.add(DrawUI.h3("Selection"))
		.add(DrawUI.text("No item selected"))
);

document.body.appendChild(panel.dom);
```

## Public API

### JavaScript entrypoints

- `drawui`: full build — all components including chart, spreadsheet, gantt, and Showdown markdown.
- `drawui/min` (alias `drawui/core`): core build — no peer-dependent components; uses simple markdown fallback.
- `drawui/primitives`: DOM wrappers and low-level controls.
- `drawui/components`: reusable composed components.
- `drawui/layout`: panel and layout shells.
- `drawui/overlays`: floating and overlay components.
- `drawui/utils/markdown`
- `drawui/utils/panel-resizer`
- `drawui/utils/workspace-panel-dock`

```js
// Full build (default)
import { DrawUI } from "drawui";

// Core build (no chart/spreadsheet/gantt/Showdown peers required)
import { DrawUI } from "drawui/min";
// or: import { DrawUI } from "drawui/core";
```

### CSS entrypoints

- `drawui/styles/core.css`: imports the package-owned token, reset, primitive, and generic component layers.
- `drawui/styles/icons.css`: Material Symbols stylesheet used by icon-emitting components.
- `drawui/styles/tokens.css`: design tokens only.
- `drawui/styles/reset.css`: scoped reset helpers.
- `drawui/styles/primitives.css`: primitive classes and compatibility selectors.
- `drawui/styles/components.css`: generic composed-component styles.
- `drawui/styles/themes/dark.css`
- `drawui/styles/themes/light.css`

Only the exported files above are public package API. Workspace compatibility files and app-specific bundles are repository internals.

## What DrawUI Includes

- Chainable DOM primitives such as text, rows, columns, buttons, inputs, tooltips, spinners, tabs, and listboxes.
- Composed components such as `CollapsiblePanel`, `CollapsibleSection`, `DrillDownUpList`, `TreeView`, `ReorderableList`, `MarkdownComponent`, and `ChartUIComponent`.
- Layout shells such as `BasePanel`, `SimpleFloatingWindow`, and `TabPanel`.
- Overlay components such as `FloatingPanel` and `PieMenu`.
- A small CSS system built around `--dui-*` tokens and theme overrides.

The root `DrawUI` facade also exposes high-level factories such as `DrawUI.markdown()` for Showdown-backed markdown rendering and `DrawUI.chart()` for Chart.js-backed data visualizations.

See [docs/component-index.md](docs/component-index.md) for the complete export inventory and emitted class names.

## Styling Model

DrawUI styles are token-driven. Theme, spacing, typography, border, and motion values are exposed through `--dui-*` CSS variables. Public package classes use the `dui-*` namespace, while a set of legacy runtime classes remains available for compatibility.

If you use components that render Material Symbols, import `drawui/styles/icons.css` in addition to `drawui/styles/core.css`.

## Property Tables

`DrawUI.propertyTable()` accepts keyed row specs.

- Use `label` and `value` for the default two-cell row shape.
- Use `cells` when a row needs multiple value cells, such as X/Y/Z editors or grouped color pickers.
- Attach `onChange`, `onInput`, `onBlur`, `onEnter`, and `onClick` callbacks either at the row level or on individual cell specs.

```js
const table = DrawUI.propertyTable({
	compact: true,
	rows: {
		name: {
			label: "Name",
			value: nameInput,
			onChange: () => saveName(nameInput.getValue()),
		},
		position: {
			tooltip: "World position",
			cells: [
				{ content: "Position", className: "PropertyTable-label" },
				{ content: xInput, className: "PropertyTable-value", onChange: () => saveAxis("x", xInput.getValue()) },
				{ content: yInput, className: "PropertyTable-value", onChange: () => saveAxis("y", yInput.getValue()) },
				{ content: zInput, className: "PropertyTable-value", onChange: () => saveAxis("z", zInput.getValue()) },
			],
		},
	},
});
```

## Lifecycle Expectations

All public components expose `.dom`. Components that attach global listeners, timers, observers, or external DOM mounts should also provide `dispose()`. Public mutating helpers should keep chainable return behavior unless the method naturally returns another value.

## Compatibility

Repository-level compatibility shims still exist for workspace safety, but they are not part of the published package contract and are not documented as public imports.
