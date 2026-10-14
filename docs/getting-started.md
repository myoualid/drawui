# IfcOpenShell GUI Getting Started

## Install

```sh
npm install @aeco-dev/gui @aeco-dev/layout
```

Point `@aeco-dev/gui` and `@aeco-dev/layout` at the installed packages when the page has no bundler:

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

## Two entry points

`@aeco-dev/gui` is the component library. `@aeco-dev/layout` is the workspace manager: `World`, `Layout`, and `Panel`. Import `@aeco-dev/gui/gui.css` for components. Import `@aeco-dev/layout/layout.css` as well when the app docks panels.

`Chart`, `DataGrid`, `GanttChart`, `NodeGraph`, and `Markdown` are named exports of `@aeco-dev/gui`. Their libraries load on first use.

## Base Imports

```js
import { StackPanel, Heading, Text } from "@aeco-dev/gui";
import "@aeco-dev/gui/gui.css";
```

`@aeco-dev/gui/gui.css` already includes icons, both themes, and the optional widget styles. Set `data-theme="light"` or `data-theme="dark"` on `<html>` to switch themes.

## First Panel

```js
import { FloatingWindow, StackPanel, Heading, Text } from "@aeco-dev/gui";
import "@aeco-dev/gui/gui.css";

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

`@aeco-dev/layout` exports three classes. The shell docks panels. Application code owns commands, selection, and data, and listens for layout events.

```js
import { Text, Button } from "@aeco-dev/gui";
import { World, Layout, Panel } from "@aeco-dev/layout";
import "@aeco-dev/gui/gui.css";
import "@aeco-dev/layout/layout.css";

const world = new World();
world.mount(document.body);

const layout = new Layout({ leftOpen: true }).init(world);

const layers = new Panel({
  layout,
  position: "left",
  id: "layers",
  label: "Layers",
  title: "Layers",
  floatable: true,
});
layers.add(new Text("Layer list"));
layers.show();

const openLayers = new Button("Layers").onClick(() => layers.toggle());
layers.bindTo(openLayers.dom);

layout.on("workspace", ({ position, open }) => {
  console.log(position, open);
});
```

### World

Builds the shell: ribbon, left / right / bottom regions, viewport, and footer.

- `new World(config?)` — default regions, or a config node whose `id` is `"World"`
- `world.mount(parent)` — append the shell
- `world.dom` — root element
- `world.root` — root control

Region ids the layout looks up: `RibbonMenu`, `HeaderBar`, `LayoutToggleBar`, `WorkspaceLeft`, `WorkspaceRight`, `WorkspaceBottom`, `Viewport`, `Footer`.

### Layout

Attaches stacks, resizers, and the tab registry to a world. `position` is `"left"`, `"right"`, or `"bottom"`.

- `new Layout(options).init(world | element | id)`
- `on(event, handler)` / `off(event, handler)` — `tab:added`, `tab:removed`, `tab:selected`, `workspace`
- `addTab(position, id, label, content, options?)`
- `ensureTab`, `removeTab`, `selectTab`, `toggleTab`, `hasTab`
- `getTabIds`, `getSelectedTabId`, `isTabSelected`, `clearTabs`, `setTabLabel`
- `openWorkspace`, `closeWorkspace`, `toggleWorkspace`, `isWorkspaceOpen`
- `setWorkspaceSize`, `getWorkspaceSize`, `resetLayout`
- `moveSegment(from, to, group)` — move every panel that shares `group`
- `bindToggle(element, position, id)` — a button the app owns shows and hides a tab
- `prependToggleBarChild(node)` — insert a node in the header toggle row
- `getFloatingWindowMountElement()`
- `destroy()`

Options include `leftOpen`, `rightOpen`, `bottomOpen`, and the default region sizes (`leftWorkspaceWidth`, `rightWorkspaceWidth`, `bottomWorkspaceHeight`).

### Panel

A docked collapsible panel. Pass the `layout` created above.

- `new Panel({ layout, position, id, label, title, icon, group, floatable, startFloating })`
- `add(...)` — panel content
- `show()`, `hide()`, `toggle()`, `select()`
- `bindTo(element)` / `unbind()`
- `setLabel(label)`
- `detachToFloatingWindow()`, `isFloating()`, `getFloatingWindow()`
- `isVisible()`, `isSelected()`
- `destroy()`

`startFloating: true` opens the panel as a floating window when it is not docked. Panels that share `group` move between regions together.

## Typical Pattern

1. Import `@aeco-dev/gui/gui.css` once at application startup.
2. Import `@aeco-dev/layout/layout.css` only if you use `Layout`.
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