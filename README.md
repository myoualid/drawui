# IfcOpenShell GUI

IfcOpenShell GUI is a framework-free ESM UI library for DOM-native tools, panels, overlays, and form controls. Components and workspace layout are published as two packages.

This README is the package guide. Detailed reference material lives in `docs/`:

- [Docs hub](docs/index.html) (GitHub Pages landing page)
- [TypeDoc](docs/generated/typedoc/index.html) (generated)
- [AI docs](docs/ai/) — [component index](docs/ai/component-index.md) + [usage guide](docs/ai/SKILL.md)
- [Getting started](docs/getting-started.md)
- [Styling guide](docs/styling.md)
- [Publishing](docs/publishing.md)

## Install

```sh
npm install @aeco-dev/gui @aeco-dev/layout
```

Imports use `@aeco-dev/gui` and `@aeco-dev/layout`. A bundler resolves those names after install. A page without a bundler maps them onto the package files:

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

## Quick Start

UI components and workspace layout are separate packages. `@aeco-dev/layout` depends on `@aeco-dev/gui`.

```js
import { FloatingWindow, StackPanel, Heading, Text } from "@aeco-dev/gui";
import "@aeco-dev/gui/gui.css";

const panel = new FloatingWindow({
  title: "Inspector",
  position: "right",
  width: "320px",
});

panel.content.add(
  new StackPanel({ isVertical: true })
    .add(new Heading(3, "Selection"))
    .add(new Text("No item selected")),
);

document.body.appendChild(panel.dom);
```

An app that docks panels imports layout as well. The GUI modules do not include the layout engine.

```js
import { Text } from "@aeco-dev/gui";
import { World, Layout, Panel } from "@aeco-dev/layout";
import "@aeco-dev/gui/gui.css";
import "@aeco-dev/layout/layout.css";

const world = new World();
world.mount(document.body);

const layout = new Layout({ leftOpen: true }).init(world);
const layers = new Panel({ title: "Layers" });
layers.content.add(new Text("Layer list"));
```

The installed package is the browser build. Import the classes you construct; the bundle still includes the rest of that entry point.

```js
import { Button, StackPanel, Chart } from "@aeco-dev/gui";

new Button("Save");
new StackPanel({ isVertical: true });
new Chart({ chartConfiguration: { type: "bar", data: { labels: ["A"], datasets: [{ data: [1] }] } } });
```

Chart, DataGrid, GanttChart, NodeGraph, and Markdown are part of `@aeco-dev/gui`. Their libraries load the first time you construct one.

## Public API

### JavaScript

- `@aeco-dev/gui` — component classes.
- `@aeco-dev/layout` — `World`, `Layout`, and `Panel`.

Those names are the package entry points. Each one is the browser build.

### CSS

- `@aeco-dev/gui/gui.css` — tokens, components, icons, shell, markdown, pie menu, themes, and peer widgets.
- `@aeco-dev/layout/layout.css` — workspace grid. Load it after `gui.css`.

## What IfcOpenShell GUI Includes

- Chainable DOM primitives such as text, rows, columns, buttons, inputs, tooltips, spinners, tabs, and listboxes.
- Composed components such as `Flyout`, `CollapsiblePanel`, `NavigationList`, `TreeView`, `SortableList`, and `Markdown`.
- Layout shells such as `Panel`, `CollapsiblePanel`, and `FloatingDialog`.
- Overlay components such as `FloatingWindow`.
- Optional peer widgets: `Chart`, `DataGrid`, `GanttChart`, and `NodeGraph` from `@aeco-dev/gui`.
- `Layout` for the workspace grid: regions, docking, and `Layout.Panel`.
- A small CSS system built around `--dui-*` tokens and theme overrides.

`new Markdown(text)` uses Showdown when it is installed, and the built-in converter otherwise. Chart.js, AG Grid, jsGantt, and Highlight.js load the first time `Chart`, `DataGrid`, `GanttChart`, or `Markdown` needs them.

See [docs/ai/component-index.md](docs/ai/component-index.md) for the complete export inventory and emitted class names.

## Styling Model

IfcOpenShell GUI styles are token-driven. Theme, spacing, typography, border, and motion values are exposed through `--dui-*` CSS variables. Public package classes use the `dui-*` namespace, while a set of legacy runtime classes remains available for compatibility.

`@aeco-dev/gui/gui.css` includes Material Symbols. Set `data-theme="light"` or `data-theme="dark"` on `<html>` to switch themes.

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
