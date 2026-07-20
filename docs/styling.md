# DrawUI.js Styling Guide

## CSS Entry Points

DrawUI publishes the following CSS files as package API:

- `drawui/styles/core.css`
- `drawui/styles/icons.css`
- `drawui/styles/tokens.css`
- `drawui/styles/reset.css`
- `drawui/styles/primitives.css`
- `drawui/styles/components.css`
- `drawui/styles/themes/dark.css`
- `drawui/styles/themes/light.css`

`drawui/styles/core.css` is the normal starting point. It imports the token, reset, primitive, and component layers in the supported package order.

DrawUI core does **not** style `html` / `body` or zero page margins. Full-viewport app shells should import the optional host layer (or set equivalent rules themselves):

```js
import "drawui/styles/core.css";
import "drawui/styles/app-host.css";
import "drawui/styles/themes/dark.css";
```

## Tokens

All package styles use the `--dui-*` namespace. Tokens are defined in `drawui/styles/tokens.css` and overridden by theme files.

| Category | Variables |
| --- | --- |
| Core surfaces | `--dui-color-bg`, `--dui-color-surface`, `--dui-color-surface-hover` |
| Text and semantic colors | `--dui-color-text`, `--dui-color-text-muted`, `--dui-color-danger`, `--dui-color-warning`, `--dui-color-success` |
| Accent, border, and focus | `--dui-color-border`, `--dui-color-focus`, `--dui-color-accent`, `--dui-color-accent-soft`, `--dui-focus-ring` |
| Typography | `--dui-font-ui`, `--dui-font-mono`, `--dui-font-size-xs`, `--dui-font-size-sm`, `--dui-font-size-md`, `--dui-font-size-lg` |
| Spacing | `--dui-space-1`, `--dui-space-2`, `--dui-space-3`, `--dui-space-4`, `--dui-space-5`, `--dui-space-6` |
| Radius, elevation, motion | `--dui-radius` (single corner radius for all components), `--dui-shadow-overlay`, `--dui-transition-fast` |
| App shell layout | `--dui-headerbar-height`, `--dui-sidebar-width`, `--dui-shell-margin`, `--dui-config-width` |

## Public Selector Rules

- Use `dui-*` names for new public package selectors.
- Prefer token references over hard-coded colors, spacing, and radius values.
- Keep package CSS scoped to generic library surfaces rather than host-page layout.

## Themes

Import one theme stylesheet after `drawui/styles/core.css`:

```js
import "drawui/styles/core.css";
import "drawui/styles/themes/dark.css";
```

Theme files should override token values, not redefine component structure.

## Icons

Components that emit Material Symbols markup require `drawui/styles/icons.css`.

```js
import "drawui/styles/icons.css";
```

## Optional component styles

Full-build demos may link additional styles for peer-dependent components:

- `drawui/styles/components/nodes.css` — node graph editor
- `drawui/styles/components/hud.css` — HUD labels in node meta
- `drawui/styles/components/pie-menu.css` — radial menu overlay
- `drawui/styles/components/scheduling.css` — gantt/scheduling views
- `drawui/styles/components/ag-grid-custom.css` — spreadsheet grid theming

Spinner styles ship via `drawui/styles/core.css` (imported through `components.css`).
