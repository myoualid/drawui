# IfcOpenShell GUI

Install with `npm install @aeco-dev/gui @aeco-dev/layout`.

Application code imports two packages:

- `@aeco-dev/gui` — component classes. Construct with `new Button("Save")`. `Chart`, `DataGrid`, `GanttChart`, `NodeGraph`, and `Markdown` are named exports of this package. Their libraries load on first use.
- `@aeco-dev/layout` — workspace shell. `new World()` builds the default regions. `new Layout(config).init(world)` attaches them. `new Panel(...)` is a docked panel.

Styles ship on the package names: `@aeco-dev/gui/gui.css` and `@aeco-dev/layout/layout.css`.

Named imports are the public API. Each package entry point is its browser build.
