# IfcOpenShell GUI

Install with `npm install ifcopenshell-gui`.

Application code imports two specifiers. An import map or bundler alias points them at this package, so they stay off the existing `ifcopenshell` package:

- `ifcopenshell/gui` — component classes. Construct with `new Button("Save")`. `Chart`, `DataGrid`, `GanttChart`, `NodeGraph`, and `Markdown` are named exports of this entry. Their libraries load on first use.
- `ifcopenshell/layout` — workspace shell. `new World()` builds the default regions. `new Layout(config).init(world)` attaches them. `new Panel(...)` is a docked panel.

Styles ship on the package name: `ifcopenshell-gui/styles/gui.css` and `ifcopenshell-gui/styles/layout.css`. The browser bundle `dist/gui.css` also includes optional widget styles.

Named imports are the public API. A bundler can drop classes you do not import from the source barrels. `dist/gui.js` and `dist/layout.js` are the full browser builds used by import maps.
