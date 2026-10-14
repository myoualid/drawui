# @aeco-dev/layout

A lightweight UI library for Aeco Industry. This package is the workspace layout: `World`, `Layout`, and `Panel`, shipped as `layout.js`, `layout.css`, and TypeScript declarations. Documentation: [Find here](https://myoualid.github.io/drawui/).

```sh
npm install @aeco-dev/layout
```

Installing this package also installs `@aeco-dev/gui`. Load the GUI stylesheet first so layout tokens resolve.

```js
import { Text } from "@aeco-dev/gui";
import { World, Layout, Panel } from "@aeco-dev/layout";
import "@aeco-dev/gui/gui.css";
import "@aeco-dev/layout/layout.css";

const world = new World();
world.mount(document.body);

const layout = new Layout({ leftOpen: true }).init(world);
const layers = new Panel({ title: "Layers" });
layers.content.add(new Text("Layer list"));
```
