# IfcOpenShell GUI

IfcOpenShell GUI is a framework-free ESM UI library for DOM-native tools, panels, overlays, and form controls. Install one package, then import the UI library and the workspace manager as separate entry points.

This README is the package guide. Detailed reference material lives in `docs/`:

- [Docs hub](docs/index.html) (GitHub Pages landing page)
- [TypeDoc](docs/generated/typedoc/index.html) (generated)
- [AI docs](docs/ai/) — [component index](docs/ai/component-index.md) + [usage guide](docs/ai/SKILL.md)
- [Getting started](docs/getting-started.md)
- [Styling guide](docs/styling.md)
- [Publishing](docs/publishing.md)

## Install

```sh
npm install ifcopenshell-gui
```

Imports use `ifcopenshell/gui` and `ifcopenshell/layout`. Map those specifiers onto this package:

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

## Quick Start

UI components and workspace layout are separate entry points of the same package.

```js
import { FloatingWindow, StackPanel, Heading, Text } from "ifcopenshell/gui";
import "ifcopenshell-gui/styles/gui.css";

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
import { Text } from "ifcopenshell/gui";
import { World, Layout, Panel } from "ifcopenshell/layout";
import "ifcopenshell-gui/styles/gui.css";
import "ifcopenshell-gui/styles/layout.css";

const world = new World();
world.mount(document.body);

const layout = new Layout({ leftOpen: true }).init(world);
const layers = new Panel({ title: "Layers" });
layers.content.add(new Text("Layer list"));
```

Import only the components you construct. A bundler drops the rest.

```js
import { Button, StackPanel, Chart } from "ifcopenshell/gui";

new Button("Save");
new StackPanel({ isVertical: true });
new Chart({ chartConfiguration: { type: "bar", data: { labels: ["A"], datasets: [{ data: [1] }] } } });
```

Chart, DataGrid, GanttChart, NodeGraph, and Markdown are part of `ifcopenshell/gui`. Their libraries load the first time you construct one.

## Public API

### JavaScript

- `ifcopenshell/gui` — component classes. Browser build: `dist/gui.js`.
- `ifcopenshell/layout` — `World`, `Layout`, and `Panel`. Browser build: `dist/layout.js`.

`ifcopenshell/gui` and `ifcopenshell/layout` are the public specifiers. The package exports `ifcopenshell-gui/gui` and `ifcopenshell-gui/layout` are the tree-shakeable source barrels. `dist/gui.js` and `dist/layout.js` are the full browser builds used by import maps.

### CSS

- `ifcopenshell-gui/styles/gui.css` — tokens, components, icons, shell, markdown, pie menu, themes, and peer widgets. Browser build: `dist/gui.css`.
- `ifcopenshell-gui/styles/layout.css` — workspace grid. Load it after `gui.css`. Browser build: `dist/layout.css`.

`styles/core.css` is the token and component layer inside `gui.css`. `styles/workspace.css` loads the same rules as `styles/layout.css`.

## What IfcOpenShell GUI Includes

- Chainable DOM primitives such as text, rows, columns, buttons, inputs, tooltips, spinners, tabs, and listboxes.
- Composed components such as `Flyout`, `CollapsiblePanel`, `NavigationList`, `TreeView`, `SortableList`, and `Markdown`.
- Layout shells such as `Panel`, `CollapsiblePanel`, and `FloatingDialog`.
- Overlay components such as `FloatingWindow`.
- Optional peer widgets: `Chart`, `DataGrid`, `GanttChart`, and `NodeGraph` from `ifcopenshell/gui`.
- `Layout` for the workspace grid: regions, docking, and `Layout.Panel`.
- A small CSS system built around `--dui-*` tokens and theme overrides.

`new Markdown(text)` uses Showdown when it is installed, and the built-in converter otherwise. Chart.js, AG Grid, jsGantt, and Highlight.js load the first time `Chart`, `DataGrid`, `GanttChart`, or `Markdown` needs them.

See [docs/ai/component-index.md](docs/ai/component-index.md) for the complete export inventory and emitted class names.

## Styling Model

IfcOpenShell GUI styles are token-driven. Theme, spacing, typography, border, and motion values are exposed through `--dui-*` CSS variables. Public package classes use the `dui-*` namespace, while a set of legacy runtime classes remains available for compatibility.

If you use components that render Material Symbols, import `ifcopenshell-gui/styles/icons.css` in addition to `ifcopenshell-gui/styles/core.css`.

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
