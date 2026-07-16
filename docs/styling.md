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

## Tokens

**Canonical namespace:** use `--dui-*` for all new styles. These are defined in `drawui/styles/tokens.css` and overridden by theme files.

| Category | Variables |
| --- | --- |
| Core surfaces | `--dui-color-bg`, `--dui-color-surface`, `--dui-color-surface-hover` |
| Text and semantic colors | `--dui-color-text`, `--dui-color-text-muted`, `--dui-color-danger`, `--dui-color-warning`, `--dui-color-success` |
| Accent, border, and focus | `--dui-color-border`, `--dui-color-focus`, `--dui-color-accent`, `--dui-color-accent-soft`, `--dui-focus-ring` |
| Typography | `--dui-font-ui`, `--dui-font-mono`, `--dui-font-size-xs`, `--dui-font-size-sm`, `--dui-font-size-md`, `--dui-font-size-lg` |
| Spacing | `--dui-space-1`, `--dui-space-2`, `--dui-space-3`, `--dui-space-4`, `--dui-space-5`, `--dui-space-6` |
| Radius, elevation, motion | `--dui-radius` (single corner radius for all components), `--dui-shadow-overlay`, `--dui-transition-fast` |

### Legacy alias variables

Older DrawUI and Olympus code may still reference compatibility aliases defined in `styles/rules.css`:

| Legacy alias | Maps to |
| --- | --- |
| `--theme-text`, `--theme-bg` | `--dui-color-text`, `--dui-color-bg` |
| `--brand-color`, `--brand-color-soft` | `--dui-color-accent`, `--dui-color-accent-soft` |
| `--border`, `--glass-surface` | `--dui-color-border`, `--dui-surface-bg` |
| `--blue`, `--red`, `--green`, `--yellow` | Semantic `--dui-color-*` tokens |

Prefer `--dui-*` in new code. Legacy aliases remain for backward compatibility and will be migrated incrementally.

## Public Selector Rules

- Use `dui-*` names for new public package selectors.
- Prefer token references over hard-coded colors, spacing, and radius values.
- Keep package CSS scoped to generic library surfaces rather than host-page layout.
- Treat legacy runtime classes as compatibility selectors, not the naming model for new API.

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

## Internal Repository Styles

The repository may still contain broad compatibility bundles such as `styles/minimal.css` and `styles/master.css`. They are not public package entrypoints and should not be used in package-facing examples or external consumer docs.