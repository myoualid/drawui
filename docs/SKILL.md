# DrawUI.js AI Usage Guide

This guide is for coding agents working in DrawUI itself or in applications that consume the package.

## Purpose

DrawUI.js is a framework-free ESM UI library. It provides chainable DOM wrappers, generic panels, overlays, lists, tabs, and a small token-driven CSS layer. Keep package code app-agnostic.

## Import Rules

Use only exported package paths:

```js
import { DrawUI, FloatingWindow, Control, Container, Button, RadialMenu } from "drawui";
import "drawui/styles/core.css";
import "drawui/styles/icons.css";
```

Do not import from package-internal files unless the path is exported in `drawUI/package.json`.

## Component Selection

- Use `new StackPanel({ isVertical: false })` / `{ isVertical: true }` for simple layouts.
- Use `ContentPanel` for fixed header, content, and footer regions.
- Use `FloatingWindow` for draggable or dockable floating windows.
- Use `CollapsiblePanel` for accordion content inside another surface.
- Use `Flyout` for standalone expandable tool panels.
- Use `new TabView()` for local tab strips.
- Use `RibbonBar` + `RibbonButton` for the app shell ribbon (borderless icon+label, tab-style selection). Prefer `IconButton` for bordered tile actions.
- Use `SortableList` only when order is user-editable.
- Use `NavigationList` for one-level-at-a-time hierarchical browsing.
- Use `TreeView` for nested expand/collapse trees (same `getChildren` / `getLabel` data shape as drill-down).
- Use `RadialMenu` only when radial interaction is a deliberate fit for the workflow.

## Styling Rules

- Package CSS uses `--dui-*` tokens only.
- New public selectors should use the `dui-*` namespace.
- Import `drawui/styles/icons.css` when using icon-emitting components.
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

- Do not make DrawUI depend on host-application runtime objects.
- Do not move app-specific CSS into package core layers.
- Do not add framework dependencies for core components.
- Do not introduce hidden global DOM side effects without a cleanup path.

## Known Gotchas

- Some overlays and floating surfaces mount or listen outside their root element and still require careful lifecycle handling.
- Material Symbols are the current icon mechanism, so icon-emitting examples should import `drawui/styles/icons.css`.
