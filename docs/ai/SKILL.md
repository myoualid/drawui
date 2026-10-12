# IfcOpenShell GUI AI Usage Guide

This guide is for coding agents working in IfcOpenShell GUI itself or in applications that consume the package.

## Purpose

IfcOpenShell GUI is a framework-free ESM UI library. It provides chainable DOM wrappers, generic panels, overlays, lists, tabs, and a small token-driven CSS layer. Keep package code app-agnostic.

## Import Rules

Install with `npm install ifcopenshell-gui`. Map the public specifiers onto that package, then import classes:

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
import { Button, FloatingWindow, Chart } from "ifcopenshell/gui";
import { World, Layout, Panel } from "ifcopenshell/layout";
import "ifcopenshell-gui/styles/gui.css";
import "ifcopenshell-gui/styles/layout.css";
```

`ifcopenshell/gui` is the component library, including `Chart`, `DataGrid`, `GanttChart`, `NodeGraph`, and `Markdown`. Those libraries load on first use. `ifcopenshell/layout` exports `World`, `Layout`, and `Panel`.

Construct with `new Button("Save")`, `new World()`, and `new Layout(config).init(world)`. A bundler can drop classes you do not import from the source barrels. `dist/gui.js` and `dist/layout.js` are the full browser builds.

Do not import from package-internal files unless the path is exported in `package.json`.

## Component Selection

- Use `StackPanel` and `Grid` to arrange components inside a panel.
- Use `new World()`, then `new Layout(config).init(world)`, when the app docks panels. Listen with `layout.on("workspace", handler)` and `layout.on("tab:selected", handler)`.
- Use `new Panel({ layout, position, id, label })` from `ifcopenshell/layout` for a docked panel. Call `panel.bindTo(button)` for a control the app owns.
- Use `Panel` from `ifcopenshell/gui` for fixed header, content, and footer regions.
- Use `FloatingWindow` for draggable or dockable floating windows.
- Use `CollapsiblePanel` for accordion content inside another surface.
- Use `Flyout` for standalone expandable tool panels.
- Use `new TabView()` for local tab strips.
- Use `RibbonBar` with `Button` for the app shell ribbon. Use `Operator` for icon-only actions.
- Use `SortableList` only when order is user-editable.
- Use `NavigationList` for one-level-at-a-time hierarchical browsing.
- Use `TreeView` for nested expand/collapse trees (same `getChildren` / `getLabel` data shape as drill-down).
- Use `RadialMenu` only when radial interaction is a deliberate fit for the workflow.

## Styling Rules

- Package CSS uses `--dui-*` tokens only.
- New public selectors should use the `dui-*` namespace.
- Import `ifcopenshell-gui/styles/icons.css` when using icon-emitting components.
- Keep application layout selectors, module IDs, and product-specific styles out of the package CSS entrypoints.

## Accessibility Checklist

Before adding or changing a component:

- Prefer semantic HTML elements.
- Make icon-only controls expose labels through `aria-label` or visible text.
- Preserve keyboard focus styles with `:focus-visible`.
- Reflect selection state in DOM state, class state, or ARIA state.
- Provide `disabled` behavior where a control can become unavailable.
- Add `dispose()` if the component owns global listeners, timers, observers, or external mounts.

## Do

- Add JSDoc typedefs for non-trivial options objects.
- Document public components with JSDoc descriptions and `@example` blocks (API pages are generated from these).
- Mark runnable examples with `// live` as the first line and `return` a Control (or DOM node) for an inline preview (avoid `@live` — TypeDoc treats `@…` as tags).
- Register public components in `src/api/registry.json` (status, entrypoints, emitted classes).
- Return `this` from mutating methods.
- Expose `.dom` consistently.
- Document emitted CSS classes for public components.
- Keep package examples aligned with exported package paths.

## Do Not

- Do not make IfcOpenShell GUI depend on host-application runtime objects, a context bag, or an operator/command service. The app wires clicks and listens to events.
- Do not move app-specific CSS into package core layers.
- Do not add framework dependencies for core components.
- Do not introduce a `GUI.Button()` facade, a `peers` import, or `Layout.buildWorld()`.
- Do not introduce hidden global DOM side effects without a cleanup path.

## Known Gotchas

- Some overlays and floating surfaces mount or listen outside their root element and still require careful lifecycle handling.
- Material Symbols ship in `ifcopenshell-gui/styles/gui.css`. Import `ifcopenshell-gui/styles/icons.css` only when you assemble CSS without that file.
