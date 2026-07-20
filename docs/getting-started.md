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
import { StackPanel, Heading, TextBlock } from "drawui";
import "drawui/styles/core.css";
import "drawui/styles/themes/dark.css";
```

Import `drawui/styles/icons.css` when you use components that render Material Symbols icons.

## First Panel

```js
import { FloatingWindow, StackPanel, Heading, TextBlock } from "drawui";
import "drawui/styles/core.css";
import "drawui/styles/icons.css";

const panel = new FloatingWindow({
  title: "Layers",
  position: "left",
  width: "280px"
});

const content = new StackPanel({ isVertical: true })
  .add(new Heading(3, "Visible Items"))
  .add(new TextBlock("Nothing loaded"));

panel.content.add(content);
document.body.appendChild(panel.dom);
```

## Typical Pattern

1. Import `drawui/styles/core.css` once at application startup.
2. Add a theme stylesheet such as `drawui/styles/themes/dark.css` or `drawui/styles/themes/light.css`.
3. Build layouts with `new StackPanel({ isVertical: false|true })` (or other primitives).
4. Mount the component `.dom` into your host application.
5. Call `dispose()` during teardown for components that attach global listeners or external mounts.

## Next Reads

- [README.md](../README.md) for the package overview.
- [Component index](generated/component-index.html) for the generated export inventory.
- [API reference](generated/api/index.html) for per-symbol pages.
- [styling.html](styling.html) for tokens, themes, and CSS entrypoints.
- [publishing.html](publishing.html) for distribution, builds, and GitHub Pages.
- [SKILL.html](SKILL.html) for agent-focused implementation rules.