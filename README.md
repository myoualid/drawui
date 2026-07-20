# DrawUI.js

DrawUI.js is a framework-free ESM UI library for DOM-native tools, panels, overlays, and form controls. Import JavaScript from `drawui` and styles from `drawui/styles/*` (plus optional `drawui/utils/*` helpers).

This README is the package guide. Detailed reference material lives in `docs/`:

- [Docs hub](docs/index.html) (GitHub Pages landing page)
- [TypeDoc](docs/generated/typedoc/index.html) (generated)
- [AI docs](docs/ai/) — [component index](docs/ai/component-index.md) + [usage guide](docs/ai/SKILL.md)
- [Getting started](docs/getting-started.md)
- [Styling guide](docs/styling.md)
- [Publishing](docs/publishing.md)

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
import { FloatingWindow, StackPanel, Heading, TextBlock } from "drawui";
import "drawui/styles/core.css";
import "drawui/styles/icons.css";
import "drawui/styles/themes/dark.css";

const panel = new FloatingWindow({
	title: "Inspector",
	position: "right",
	width: "320px"
});

panel.content.add(
	new StackPanel({ isVertical: true })
		.add(new Heading(3, "Selection"))
		.add(new TextBlock("No item selected"))
);

document.body.appendChild(panel.dom);
```

## Public API

### JavaScript

- `drawui`: all components, helpers, and the `DrawUI` facade. Unused exports tree-shake when your bundler processes the source ESM.
- `drawui/utils/markdown`
- `drawui/utils/flexResizer`
- `drawui/overlays/drag`
- `drawui/workspace/dock`

```js
import { DrawUI, Button, FloatingWindow, RadialMenu } from "drawui";
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
- Composed components such as `Flyout`, `CollapsiblePanel`, `NavigationList`, `TreeView`, `SortableList`, `Markdown`, and `Chart`.
- Layout shells such as `ContentPanel`, `CollapsiblePanel`, `FloatingDialog`, and `WorkspacePanel`.
- Overlay components such as `FloatingWindow`.
- A small CSS system built around `--dui-*` tokens and theme overrides.

Use `new Markdown(text)` for markdown rendering (Showdown + Highlight.js when those peers are present; otherwise the built-in converter). The root `DrawUI` facade also exposes peer factories such as `DrawUI.Chart()` for Chart.js-backed data visualizations.

See [docs/ai/component-index.md](docs/ai/component-index.md) for the complete export inventory and emitted class names.

## Styling Model

DrawUI styles are token-driven. Theme, spacing, typography, border, and motion values are exposed through `--dui-*` CSS variables. Public package classes use the `dui-*` namespace, while a set of legacy runtime classes remains available for compatibility.

If you use components that render Material Symbols, import `drawui/styles/icons.css` in addition to `drawui/styles/core.css`.

## Property Tables

`new PropertyGrid(...)` accepts keyed row specs.

- Use `label` and `value` for the default two-cell row shape.
- Use `cells` when a row needs multiple value cells, such as X/Y/Z editors or grouped color pickers.
- Attach `onChange`, `onInput`, `onBlur`, `onEnter`, and `onClick` callbacks either at the row level or on individual cell specs.

```js
const table = new PropertyGrid({
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
				{ content: "Position", className: "PropertyGrid-label" },
				{ content: xInput, className: "PropertyGrid-value", onChange: () => saveAxis("x", xInput.getValue()) },
				{ content: yInput, className: "PropertyGrid-value", onChange: () => saveAxis("y", yInput.getValue()) },
				{ content: zInput, className: "PropertyGrid-value", onChange: () => saveAxis("z", zInput.getValue()) },
			],
		},
	},
});
```

## Lifecycle Expectations

All public components expose `.dom`. Components that attach global listeners, timers, observers, or external DOM mounts should also provide `dispose()`. Public mutating helpers should keep chainable return behavior unless the method naturally returns another value.

## Compatibility

Repository-level compatibility shims still exist for workspace safety, but they are not part of the published package contract and are not documented as public imports.
