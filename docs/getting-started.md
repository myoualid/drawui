# IfcOpenShell GUI Getting Started

## Install

```sh
npm install ifcopenshell-gui
```

Point `ifcopenshell/gui` and `ifcopenshell/layout` at the installed package:

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

## Two entry points

`ifcopenshell/gui` is the component library. `ifcopenshell/layout` is the workspace manager: `World`, `Layout`, and `Panel`. Import `ifcopenshell-gui/styles/gui.css` for components. Import `ifcopenshell-gui/styles/layout.css` as well when the app docks panels.

`Chart`, `DataGrid`, `GanttChart`, `NodeGraph`, and `Markdown` are named exports of `ifcopenshell/gui`. Their libraries load on first use.

## Base Imports

```js
import { StackPanel, Heading, Text } from "ifcopenshell/gui";
import "ifcopenshell-gui/styles/gui.css";
```

`styles/gui.css` already includes icons and both themes. `styles/core.css` is the token and component layer inside it, if you want to assemble CSS yourself.

## First Panel

```js
import { FloatingWindow, StackPanel, Heading, Text } from "ifcopenshell/gui";
import "ifcopenshell-gui/styles/gui.css";

const panel = new FloatingWindow({
  title: "Layers",
  position: "left",
  width: "280px"
});

const content = new StackPanel({ isVertical: true })
  .add(new Heading(3, "Visible Items"))
  .add(new Text("Nothing loaded"));

panel.content.add(content);
document.body.appendChild(panel.dom);
```

## Workspace

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

## Typical Pattern

1. Import `ifcopenshell-gui/styles/gui.css` once at application startup.
2. Import `ifcopenshell-gui/styles/layout.css` only if you use `Layout`.
3. Build layouts with `new StackPanel({ isVertical: false|true })` (or other primitives).
4. Mount the component `.dom` into your host application.
5. Call `dispose()` during teardown for components that attach global listeners or external mounts.

## Next Reads

- [README.md](../README.md) for the package overview.
- [Component index](ai/component-index.html) for the generated export inventory.
- [API reference](generated/api/index.html) for per-symbol pages.
- [styling.html](styling.html) for tokens, themes, and CSS entrypoints.
- [publishing.html](publishing.html) for distribution, builds, and GitHub Pages.
- [AI usage guide](ai/SKILL.html) for agent-focused implementation rules.