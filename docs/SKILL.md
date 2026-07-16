# DrawUI.js AI Usage Guide

This guide is for coding agents working in DrawUI itself or in applications that consume the package.

## Purpose

DrawUI.js is a framework-free ESM UI library. It provides chainable DOM wrappers, generic panels, overlays, lists, tabs, and a small token-driven CSS layer. Keep package code app-agnostic.

## Import Rules

Use only exported package entrypoints:

```js
import { DrawUI, FloatingPanel } from "drawui";
import { UIElement, UIDiv, UIButton } from "drawui/primitives";
import { PieMenu } from "drawui/overlays";
import "drawui/styles/core.css";
import "drawui/styles/icons.css";
```

Do not import from package-internal files unless the path is exported in `drawUI/package.json`.

## Component Selection

- Use `DrawUI.row()` or `DrawUI.column()` for simple layouts.
- Use `BasePanel` for fixed header, content, and footer regions.
- Use `FloatingPanel` for draggable or dockable floating windows.
- Use `CollapsibleSection` for accordion content inside another surface.
- Use `CollapsiblePanel` for standalone expandable tool panels.
- Use `UITabbedPanel` or `DrawUI.tabbedPanel()` for local tab strips.
- Use `ReorderableList` only when order is user-editable.
- Use `DrillDownUpList` for one-level-at-a-time hierarchical browsing.
- Use `TreeView` for nested expand/collapse trees (same `getChildren` / `getLabel` data shape as drill-down).
- Use `PieMenu` only when radial interaction is a deliberate fit for the workflow.

## Styling Rules

- New package CSS should use `--dui-*` tokens.
- New public selectors should use the `dui-*` namespace.
- New docs and examples should prefer public `dui-*` selectors over legacy compatibility classes.
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
- Return `this` from mutating methods.
- Expose `.dom` consistently.
- Document emitted CSS classes for public components.
- Keep package examples aligned with exported package paths.

## Do Not

- Do not make DrawUI depend on host-application runtime objects.
- Do not move app-specific CSS into package core layers.
- Do not document or import workspace-only compatibility files as public API.
- Do not add framework dependencies for core components.
- Do not introduce hidden global DOM side effects without a cleanup path.

## Known Gotchas

- The published package excludes repository compatibility shims and workspace-only CSS bundles even though those files may exist in the repository.
- `styles/minimal.css`, `styles/master.css`, and similar broad bundles are repository internals, not public package entrypoints.
- `rules.css` mixes package-adjacent styles with host-page concerns and should not be treated as core package CSS.
- Some overlays and floating surfaces mount or listen outside their root element and still require careful lifecycle handling.
- Material Symbols are the current icon mechanism, so icon-emitting examples should import `drawui/styles/icons.css`.
