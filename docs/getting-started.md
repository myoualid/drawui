# DrawUI.js Getting Started

## Install

Add DrawUI as a package dependency:

```json
{
  "dependencies": {
    "drawui": "file:./drawUI"
  }
}
```

DrawUI ships source ESM and CSS entrypoints, so your toolchain should support ES modules and CSS imports.

## Base Imports

```js
import { DrawUI } from "drawui";
import "drawui/styles/core.css";
import "drawui/styles/themes/dark.css";
```

Import `drawui/styles/icons.css` when you use components that render Material Symbols icons.

## First Panel

```js
import { DrawUI, FloatingPanel } from "drawui";
import "drawui/styles/core.css";
import "drawui/styles/icons.css";

const panel = new FloatingPanel({
  title: "Layers",
  position: "left",
  width: "280px"
});

const content = DrawUI.column()
  .add(DrawUI.h3("Visible Items"))
  .add(DrawUI.text("Nothing loaded"));

panel.content.add(content);
document.body.appendChild(panel.dom);
```

## Choosing An Entrypoint

- Use `drawui` when you want the main facade or high-level panel components.
- Use `drawui/primitives` when you want direct access to DOM wrappers and low-level controls.
- Use `drawui/components` for reusable composed widgets.
- Use `drawui/layout` for panel shells.
- Use `drawui/overlays` for floating overlays and radial interaction surfaces.

## Typical Pattern

1. Import `drawui/styles/core.css` once at application startup.
2. Add a theme stylesheet such as `drawui/styles/themes/dark.css` or `drawui/styles/themes/light.css`.
3. Build layouts with `DrawUI.row()` and `DrawUI.column()` or direct primitives.
4. Mount the component `.dom` into your host application.
5. Call `dispose()` during teardown for components that attach global listeners or external mounts.

## Next Reads

- [README.md](../README.md) for the package overview.
- [component-index.md](component-index.md) for the full export inventory.
- [styling.md](styling.md) for tokens, themes, and CSS entrypoints.
- [ai-usage.md](ai-usage.md) for agent-focused implementation rules.