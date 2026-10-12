# IfcOpenShell GUI Styling Guide

## CSS Entry Points

Two stylesheets match the two JavaScript entry points:

- `ifcopenshell-gui/styles/gui.css` — UI components, icons, shell, and themes
- `ifcopenshell-gui/styles/layout.css` — workspace grid (load after `gui.css`)

The browser bundle `dist/gui.css` is `gui.css` plus optional widget styles (`styles/peers.css`: node graph, HUD, scheduling, and AG Grid). Import `styles/peers.css` directly only when you assemble CSS without that bundle.

The layers below are what those files pull in. Import a layer directly when you want a smaller set:

- `ifcopenshell-gui/styles/core.css`
- `ifcopenshell-gui/styles/icons.css`
- `ifcopenshell-gui/styles/tokens.css`
- `ifcopenshell-gui/styles/rules.css`
- `ifcopenshell-gui/styles/components.css`
- `ifcopenshell-gui/styles/themes/dark.css`
- `ifcopenshell-gui/styles/themes/light.css`

`ifcopenshell-gui/styles/gui.css` is the UI stylesheet. It imports tokens, components, icons, and themes. Use `styles/core.css` when you want that layer without icons and themes.

Add `ifcopenshell-gui/styles/layout.css` for the workspace grid. It expects the GUI tokens to already be loaded.

IfcOpenShell GUI core does **not** style `html` / `body` or zero page margins. Full-viewport app shells should import the optional host layer (or set equivalent rules themselves):

```js
import "ifcopenshell-gui/styles/core.css";
import "ifcopenshell-gui/styles/app-host.css";
import "ifcopenshell-gui/styles/themes/dark.css";
```

## Tokens

All package styles use the `--dui-*` namespace. Tokens are defined in `ifcopenshell-gui/styles/tokens.css` and overridden by theme files.

| Category | Variables |
| --- | --- |
| Core surfaces | `--dui-color-bg`, `--dui-color-surface`, `--dui-color-surface-hover` |
| Text and semantic colors | `--dui-color-text`, `--dui-color-text-muted`, `--dui-color-danger`, `--dui-color-warning`, `--dui-color-success` |
| Accent, border, and focus | `--dui-color-border`, `--dui-color-focus`, `--dui-color-accent`, `--dui-color-accent-soft`, `--dui-focus-ring` |
| Typography | `--dui-font-ui`, `--dui-font-mono`, `--dui-font-size-xs`, `--dui-font-size-sm`, `--dui-font-size-md`, `--dui-font-size-lg` |
| Spacing | `--dui-space-1`, `--dui-space-2`, `--dui-space-3`, `--dui-space-4`, `--dui-space-5`, `--dui-space-6` |
| Radius, elevation, motion | `--dui-radius` (single corner radius for all components), `--dui-shadow-overlay`, `--dui-transition-fast` |
| App shell layout | `--dui-headerbar-height`, `--dui-sidebar-width`, `--dui-logo-size` |

## Public Selector Rules

- Name a component class after the component, in PascalCase (`.Button`, `.RibbonMenu`, `.NavigationList`).
- Prefer token references over hard-coded colors, spacing, and radius values.
- Keep package CSS scoped to generic library surfaces rather than host-page layout.

## Themes

Import one theme stylesheet after `ifcopenshell-gui/styles/core.css`:

```js
import "ifcopenshell-gui/styles/core.css";
import "ifcopenshell-gui/styles/themes/dark.css";
```

Theme files should override token values, not redefine component structure.

## Icons

Components that emit Material Symbols markup require `ifcopenshell-gui/styles/icons.css`.

```js
import "ifcopenshell-gui/styles/icons.css";
```

## Optional widget styles

`ifcopenshell-gui/styles/peers.css` is included in `dist/gui.css`. It pulls in:

- `ifcopenshell-gui/styles/components/nodes.css` — node graph editor
- `ifcopenshell-gui/styles/components/hud.css` — HUD labels in node meta
- `ifcopenshell-gui/styles/components/scheduling.css` — gantt/scheduling views
- `ifcopenshell-gui/styles/components/ag-grid-custom.css` — spreadsheet grid theming

Spinner styles ship via `ifcopenshell-gui/styles/core.css` (imported through `components.css`).
