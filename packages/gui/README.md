# @aeco-dev/gui

A lightweight UI library for Aeco Industry. This package is the component build: `gui.js`, `gui.css`, and TypeScript declarations. Documentation: https://myoualid.github.io/drawui/

```sh
npm install @aeco-dev/gui
```

```js
import { Button, StackPanel } from "@aeco-dev/gui";
import "@aeco-dev/gui/gui.css";

new Button("Save");
```

Chart, DataGrid, GanttChart, NodeGraph, and Markdown load their libraries on first use. Those libraries are optional peer dependencies.

Workspace docking is a separate package: `@aeco-dev/layout`.
