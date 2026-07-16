# DrawUI.js Component Index

This index documents the maintained public surface of the DrawUI package.

## Import Surfaces

Use package exports for all public DrawUI consumption:

```js
import { DrawUI, FloatingPanel } from "drawui";
import { UIElement, UIButton } from "drawui/primitives";
import { PieMenu } from "drawui/overlays";
import "drawui/styles/core.css";
```

## Status Legend

- **Stable**: documented, maintained package API.
- **Experimental**: public, but behavior or styling may still evolve.
- **Internal**: repository code that should not be treated as package API.

## Primitives

| Component | Status | Import | Emitted class(es) | Notes |
| --- | --- | --- | --- | --- |
| `UIElement` | Stable | `drawui/primitives` | None by default | Base chainable wrapper around a DOM node. |
| `UILink` | Stable | `drawui/primitives` | `Link` | Anchor wrapper with optional icon and external-target behavior. |
| `UIImage` | Stable | `drawui/primitives` | `Image` | Image wrapper around `img`. |
| `UISVG` | Experimental | `drawui/primitives` | `SVG` | Supports fetch, clone, and ID retargeting for reusable SVGs. |
| `UIParagraph` | Stable | `drawui/primitives` | None by default | Semantic `p` wrapper. |
| `UIH1` to `UIH6` | Stable | `drawui/primitives` | None by default | Semantic heading wrappers. |
| `UISpan` | Stable | `drawui/primitives` | None by default | Generic inline wrapper. |
| `UIDiv` | Stable | `drawui/primitives` | None by default | Generic block wrapper. |
| `UIRow` | Stable | `drawui/primitives` | `Row` | Row layout primitive used throughout panel layouts. |
| `UIColumn` | Stable | `drawui/primitives` | `Column` | Stacked layout primitive. |
| `UIGrid` | Stable | `drawui/primitives` | `Grid` | Grid layout primitive with explicit column or auto-fit helpers. |
| `UIPanel` | Stable | `drawui/primitives` | `Panel` | Generic panel container. |
| `UILabel` | Stable | `drawui/primitives` | None by default | Label wrapper for form controls. |
| `UIForm` | Stable | `drawui/primitives` | None by default | Form wrapper with submit helpers. |
| `UIText` | Stable | `drawui/primitives` | `Text` | Inline text primitive. |
| `UISmallText` | Stable | `drawui/primitives` | None by default | Thin `small` wrapper. |
| `UIInput` | Stable | `drawui/primitives` | `Input` | Single-line input with editor-style propagation guards. |
| `UIIcon` | Stable | `drawui/primitives` | `material-symbols-outlined`, `Icon` | Material Symbols icon span. |
| `UITextArea` | Stable | `drawui/primitives` | `TextArea` | Multiline editor primitive with tab insertion support. |
| `UISelect` | Stable | `drawui/primitives` | `Select` | Native select wrapper. |
| `UICheckbox` | Stable | `drawui/primitives` | `Checkbox` | Checkbox input primitive. |
| `UIColor` | Stable | `drawui/primitives` | `Color` | Color input primitive. |
| `UINumber` | Stable | `drawui/primitives` | `Number` | Numeric input with drag and keyboard adjustments. |
| `UIInteger` | Stable | `drawui/primitives` | `Number` | Integer-specialized numeric input. |
| `UIBreak` | Stable | `drawui/primitives` | `Break` | Thin `br` wrapper. |
| `UIHorizontalRule` | Stable | `drawui/primitives` | `HorizontalRule` | Divider wrapper around `hr`. |
| `UIButton` | Stable | `drawui/primitives` | `Button` | Button primitive with optional prepended icon. |
| `UISquareButton` | Stable | `drawui/primitives` | `Button`, `SquareButton`, `SquareButton-label`, `SquareButton-meta`, `Active`, `Button--active` | Tile-style button for icon + label + meta content. |
| `UIProgress` | Stable | `drawui/primitives` | None by default | Native progress wrapper. |
| `UITabbedPanel` | Stable | `drawui/primitives` | `TabbedPanel`, `Tabs`, `Panels`, `Tab`, `Tab-label`, `Tab-float`, `selected` | Self-managed tab container. |
| `UIListbox` | Stable | `drawui/primitives` | `Listbox`, `Active` | Selectable list container. |
| `ListboxItem` | Stable | `drawui/primitives` | `ListboxItem` | Clickable row for `UIListbox`. |
| `UIDatePicker` | Experimental | `drawui/primitives` | `DatePicker`, `DatePicker-input`, `DatePicker-calendar` | Composite date and time picker. |
| `UISpinner` | Experimental | `drawui/primitives` | `spinner-container`, `spinner-wrapper`, `spinner`, `spinner-text`, `spinner-percentage` | Overlay spinner with text and percentage states. |
| `UITooltip` | Experimental | `drawui/primitives` | `Tooltip`, `Tooltip--{theme}`, `visible` | Hover tooltip with theme variants. |

## Composed Components

| Component | Status | Import | Emitted class(es) | Notes |
| --- | --- | --- | --- | --- |
| `DrawUI` | Stable | `drawui` | Varies by factory method | Main facade for primitives and composed helpers. |
| `BasePanel` | Stable | `drawui`, `drawui/layout` | `Panel`, `PanelHeader`, `PanelContent`, `PanelFooter` | Core resizable and draggable panel scaffold. |
| `SimpleFloatingWindow` | Stable | `drawui`, `drawui/layout` | `Panel`, `PanelHeader`, `PanelContent`, `PanelFooter`, `fill-width` | Lightweight floating panel built on `BasePanel`. |
| `TabPanel` | Stable | `drawui`, `drawui/layout` | `TabPanel`, `TabPanelHeader`, `PanelContent`, `TabPanelFooter` | Workspace-style tab page with optional floating detachment. |
| `FloatingPanel` | Stable | `drawui`, `drawui/overlays` | `FloatingPanel`, `FloatingPanel-header`, `FloatingPanel-content`, `circle`, `pos-btn`, `green`, `red`, `Row`, `centered-vertical`, `justify-between`, `fill-width`, `fill-height` | Free-floating window with docking controls. |
| `CollapsiblePanel` | Stable | `drawui`, `drawui/components` | `CollapsiblePanel`, `CollapsiblePanel-header`, `CollapsiblePanel-icon`, `CollapsiblePanel-title`, `CollapsiblePanel-content`, `CollapsiblePanel-search`, `expanded`, `Badge`, `centered` | Expandable tool panel with optional search row. |
| `CollapsibleSection` | Stable | `drawui`, `drawui/components` | `CollapsibleSection`, `CollapsibleSection-header`, `CollapsibleSection-title`, `CollapsibleSection-toggle`, `CollapsibleSection-leftIcon`, `CollapsibleSection-body`, `collapsed` | Inline accordion section. |
| `DrillDownUpList` | Stable | `drawui`, `drawui/components` | `dui-drill`, `dui-drill-header`, `dui-drill-item`, `NavigableList` (compat) | One-level-at-a-time hierarchical navigation with back control. |
| `TreeView` | Stable | `drawui`, `drawui/components` | `dui-tree`, `dui-tree-item`, `dui-tree-toggle`, `dui-tree-label`, `dui-tree-children`, `is-expanded`, `is-selected` | Expandable nested tree; same data options shape as `DrillDownUpList`. |
| `MarkdownComponent` | Stable | `drawui`, `drawui/components` | `Markdown` plus emitted markdown HTML tags | Showdown-backed markdown renderer used by `DrawUI.markdown()` when content is markdown. |
| `ChartUIComponent` | Stable | `drawui`, `drawui/components` | `Panel`, `chart-ui-component` | Chart.js-backed visualization panel used by `DrawUI.chart()`. |
| `ReorderableList` | Stable | `drawui`, `drawui/components` | `reorderable-list`, `reorderable-item`, `drag-handle`, `reorderable-placeholder`, `is-dragging`, `Listbox`, `ListboxItem`, `Checkbox` | Drag-and-drop reorder list with optional checkboxes. |
| `PieMenu` | Experimental | `drawui/overlays` | Component-specific overlay classes | Radial interaction overlay. |

### DrawUI Factory Additions

- `DrawUI.grid()` returns a `UIGrid` primitive for package-owned grid layouts.
- `DrawUI.squareButton(label, options)` returns a `UISquareButton` for tile-style action buttons without module-local styling.

## CSS Entry Points

| File | Status | Purpose |
| --- | --- | --- |
| `styles/core.css` | Stable | Imports token, reset, primitive, and generic component layers. |
| `styles/tokens.css` | Stable | Package-owned `--dui-*` design tokens. |
| `styles/reset.css` | Stable | Scoped reset helpers. |
| `styles/primitives.css` | Stable | Base primitive classes and compatibility selectors. |
| `styles/components.css` | Stable | Generic component classes and compatibility selectors. |
| `styles/icons.css` | Stable | Material Symbols stylesheet for icon-emitting components. |
| `styles/themes/dark.css` | Stable | Dark theme token values. |
| `styles/themes/light.css` | Stable | Light theme token values. |
| `styles/minimal.css` | Internal | Repository compatibility bundle. Not part of the published package API. |
| `styles/master.css` | Internal | Repository compatibility bundle. Not part of the published package API. |
