# aeco-dev GUI Styling Guide

## CSS Entry Points

The two packages expose one stylesheet each:

- `@aeco-dev/gui/gui.css` — components, icons, shell, themes, and optional widget styles
- `@aeco-dev/layout/layout.css` — workspace grid (load after `gui.css`)

Both imports are self-contained. `gui.css` includes the node graph, HUD, scheduling, and AG Grid styles, plus Material Symbols and both themes. Set `data-theme="light"` or `data-theme="dark"` on `<html>` to switch themes.

The layer files under `styles/` stay in the repository. They are not separate package exports.

aeco-dev GUI does **not** style `html` / `body` or zero page margins. Full-viewport app shells set those rules themselves.

## Tokens

All package styles use the `--dui-*` namespace. Those tokens ship in `@aeco-dev/gui/gui.css` and are overridden by the theme values in that same file.

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

Both themes ship inside `@aeco-dev/gui/gui.css`. Put the choice on the document element:

```html
<html data-theme="dark">
```

Theme values override tokens. They do not redefine component structure.

## Icons

Components that emit Material Symbols use the icon styles already included in `@aeco-dev/gui/gui.css`.

## Optional widget styles

`@aeco-dev/gui/gui.css` includes the node graph, HUD, scheduling, and AG Grid styles, along with spinner styles.
