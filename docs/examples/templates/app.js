import { Layout, World } from "@aeco-dev/layout";
import {
  StackPanel,
  Container,
  Heading,
  Text,
  Caption,
  Badge,
  Card,
  Button,
  Operator,
  InputSearch,
  InputText,
  InputTextArea,
  InputDropdown,
  InputNumber,
  InputInteger,
  InputColor,
  InputDate,
  InputList,
  Checkbox,
  Slider,
  ProgressBar,
  Form,
  Line,
  Spacer,
  TabView,
  TreeView,
  NavigationList,
  SortableList,
  LabeledBoxItem,
  PropertyGrid,
  ThemeToggle,
  Toast,
  FloatingWindow,
  Panel,
  CollapsiblePanel,
  RibbonBar,
  Code,
  Kbd,
  Hyperlink,
} from "@aeco-dev/gui";
import { layoutConfig, worldConfig } from "./world-config.js";

function createWorkspacePanel(layout, options, body) {
  const panel = new Layout.Panel({
    layout,
    position: options.position,
    group: options.group,
    id: options.id,
    label: options.label,
    icon: options.icon,
    title: options.title,
    floatable: true,
    autoShow: true,
    toggle: options.toggle,
  });
  panel.add(body.addClass("templates-panel-body"));
  return panel;
}

function row(...children) {
  return new StackPanel({ isVertical: false })
    .gap("0.5rem")
    .setStyle("alignItems", ["center"])
    .setStyle("flexWrap", ["wrap"])
    .add(...children);
}

/* ── Panel bodies ─────────────────────────────────────────────── */

function bodyProject() {
  const list = new InputList();
  for (const item of [
    { id: "office", label: "Office Tower.ifc", checked: true },
    { id: "site", label: "Site Context.ifc", checked: true },
    { id: "mep", label: "MEP Package.ifc", checked: false },
  ]) {
    list.add(
      new LabeledBoxItem(item, {
        office: "apartment",
        site: "landscape",
        mep: "plumbing",
        default: "folder_open",
      }),
    );
  }

  return new StackPanel({ isVertical: true })
    .gap("0.75rem")
    .add(
      new InputSearch("Search models…", (value) => {
        console.log("project search:", value);
      }),
    )
    .add(
      row(
        new Badge("3 models"),
        new Caption("2 visible"),
        new Hyperlink("Open folder", "#", "folder_open", false),
      ),
    )
    .add(list)
    .add(
      row(
        new Button("Load model").addClass("primary"),
        new Button("Unload").addClass("secondary"),
      ),
    );
}

function bodySpatial() {
  const tree = new TreeView({
    getLabel: (item) => item.name,
    getChildren: (item) => item.children || [],
    onItemClick: (item) => console.log("spatial:", item.name),
  });
  tree.setData({
    name: "Project",
    children: [
      {
        name: "Site",
        children: [
          {
            name: "Building A",
            children: [
              { name: "Level 00 — Ground" },
              { name: "Level 01" },
              { name: "Level 02" },
              { name: "Roof" },
            ],
          },
          { name: "Building B", children: [{ name: "Level 00" }] },
        ],
      },
      { name: "Library", children: [{ name: "Materials" }, { name: "Profiles" }] },
    ],
  });

  return new StackPanel({ isVertical: true })
    .gap("0.5rem")
    .add(new Caption("IfcProject → spatial hierarchy"))
    .add(tree.panel);
}

function bodyFilters() {
  const category = new InputDropdown().setOptions({
    all: "All categories",
    walls: "IfcWall",
    slabs: "IfcSlab",
    windows: "IfcWindow",
  });
  const opacity = new Slider(0.85).setRange(0, 1).setStep(0.05).setPrecision(2);

  return new Form()
    .setStyle("display", ["flex"])
    .setStyle("flexDirection", ["column"])
    .gap("0.5rem")
    .add(new Text("Category"))
    .add(category)
    .add(new Text("Opacity"))
    .add(opacity)
    .add(
      row(
        new Checkbox(true).addClass("Card-checkbox"),
        new Text("Hide openings"),
      ),
    )
    .add(
      row(
        new Checkbox(false).addClass("Card-checkbox"),
        new Text("Isolate selection"),
      ),
    )
    .add(new Spacer("0.25rem"))
    .add(
      row(
        new Button("Apply").addClass("primary"),
        new Button("Reset").addClass("secondary"),
      ),
    );
}

function bodySelectionSets() {
  const sortable = new SortableList(
    [
      { label: "Exterior walls", checked: true },
      { label: "Core structure", checked: true },
      { label: "Furniture", checked: false },
      { label: "Temporary marks" },
    ],
    (items) => console.log("sets reordered", items),
  );

  return new StackPanel({ isVertical: true })
    .gap("0.75rem")
    .add(new Caption("Drag to reorder. Collapse the stack segment to hide."))
    .add(sortable.container)
    .add(
      row(
        new Button("New set").addClass("secondary"),
        new Operator("download").setTooltip("Export"),
      ),
    );
}

function bodyLayers() {
  const drill = new NavigationList({
    getLabel: (item) => item.name,
    getChildren: (item) => item.children || [],
    onItemClick: (item) => console.log("layer:", item.name),
  });
  drill.setData({
    name: "Layers",
    children: [
      { name: "Architecture", children: [{ name: "Walls" }, { name: "Doors" }, { name: "Windows" }] },
      { name: "Structure", children: [{ name: "Columns" }, { name: "Beams" }, { name: "Slabs" }] },
      { name: "Annotations" },
    ],
  });

  return new StackPanel({ isVertical: true })
    .gap("0.5rem")
    .add(new Caption("Drill into layer groups"))
    .add(drill.panel);
}

function bodyProperties() {
  const nameField = new InputText().setValue("Beam-12");
  const typeSelect = new InputDropdown()
    .setOptions({ IfcBeam: "IfcBeam", IfcColumn: "IfcColumn", IfcSlab: "IfcSlab" })
    .setValue("IfcBeam");
  const notes = new InputTextArea().setValue("Primary span member");
  notes.dom.rows = 2;

  const identity = new PropertyGrid({
    compact: true,
    rows: {
      name: { label: "Name", value: nameField },
      type: { label: "Type", value: typeSelect },
      guid: { label: "GlobalId", value: "2x3$Abc…" },
      notes: { label: "Notes", value: notes },
    },
  });

  const appearance = new PropertyGrid({
    compact: true,
    rows: {
      visible: { label: "Visible", value: new Checkbox(true).addClass("Card-checkbox") },
      length: { label: "Length", value: new InputNumber(12.5).setRange(0, 100).setUnit("m") },
      count: { label: "Count", value: new InputInteger(4).setRange(0, 99) },
      opacity: {
        label: "Opacity",
        value: new Slider(0.75).setRange(0, 1).setStep(0.01).setPrecision(2),
      },
      color: { label: "Color", value: new InputColor().setValue("#7d9a62") },
      created: { label: "Created", value: new InputDate(new Date()) },
      progress: { label: "LOD", value: new ProgressBar(0.45) },
    },
  });

  const tabs = new TabView();
  tabs.addTab("identity", "Identity", [identity]);
  tabs.addTab("appearance", "Appearance", [appearance]);
  tabs.select("identity");
  return tabs;
}

function bodyConsole() {
  const logLines = new StackPanel({ isVertical: true })
    .gap("0.35rem")
    .add(new Code("[10:02:11] World mounted"))
    .add(new Code("[10:02:12] Layout.init(\"World\")"))
    .add(new Code("[10:02:13] 7 Layout panels registered"))
    .add(new Text("Ready — open panels from the ribbon or toggle bar."));

  const output = new StackPanel({ isVertical: true })
    .gap("0.5rem")
    .add(new Caption("Log"))
    .add(new Text("Theme follows the document."))
    .add(new ProgressBar(1));

  const tabs = new TabView();
  tabs.addTab("log", "Log", [logLines]);
  tabs.addTab("output", "Output", [output]);
  tabs.select("log");

  return new StackPanel({ isVertical: true })
    .gap("0.75rem")
    .add(tabs)
    .add(
      row(
        new Button("Toast")
          .addClass("primary")
          .onClick(() => new Toast("Console ping", "success", { duration: 2200 })),
        new Button("Clear").addClass("secondary"),
        new Caption("Tip:"),
        new Kbd("Ctrl"),
        new Text("+ J toggles bottom workspace"),
      ),
    );
}

function openSelectionFloat() {
  document.querySelectorAll(".templates-float").forEach((node) => node.remove());
  const win = new FloatingWindow({ title: "Selection", width: "280px" });
  win.addClass("templates-float");
  win.setContent(
    new StackPanel({ isVertical: true })
      .gap("0.5rem")
      .add(new Heading(4, "Beam-12"))
      .add(new Text("IfcBeam · Level 01"))
      .add(new Badge("selected"))
      .add(new Line())
      .add(new Button("Focus").addClass("primary")),
  );
  win.dom.style.height = "auto";
  win.show();
}

function mountViewport() {
  const viewport = document.getElementById("Viewport");
  if (!viewport) return;

  const tools = new CollapsiblePanel({
    title: "Quick tools",
    icon: "build",
    showFooter: false,
    collapsed: true,
  });
  tools.content(
    new StackPanel({ isVertical: true })
      .gap("0.75rem")
      .add(
        new RibbonBar(
          [
            new Operator("near_me").setTooltip("Select"),
            new Operator("straighten").setTooltip("Measure"),
            new Operator("crop").setTooltip("Section"),
            new Operator("settings").setTooltip("Settings"),
          ],
          "flex-start",
        ),
      )
      .add(
        new Panel({
          title: "Controls",
          icon: "3d_rotation",
          showFooter: false,
          resizable: false,
          resizeHandles: [],
        }).add(
          new StackPanel({ isVertical: false })
            .setStyle("alignItems", ["center"])
            .gap("0.75rem")
            .add(new Kbd("MMB"))
            .add(new Text("Orbit")),
          new StackPanel({ isVertical: false })
            .setStyle("alignItems", ["center"])
            .gap("0.75rem")
            .add(new Kbd("Shift + MMB"))
            .add(new Text("Pan")),
          new StackPanel({ isVertical: false })
            .setStyle("alignItems", ["center"])
            .gap("0.75rem")
            .add(new Kbd("Scroll"))
            .add(new Text("Zoom")),
        ),
      ),
  );

  const shell = new Card()
    .addClass("templates-viewport-card")
    .add(
      new StackPanel({ isVertical: true })
        .gap("0.5rem")
        .add(
          row(
            new ThemeToggle({ theme: "dark" }),
            new Button("Float panel").addClass("secondary").onClick(openSelectionFloat),
          ).setStyle("flexWrap", ["nowrap"]),
        )
        .add(tools),
    );

  const host = new Container().addClass("templates-viewport");
  host.add(shell);
  viewport.appendChild(host.dom);
}

/* ── Boot ─────────────────────────────────────────────────────── */

const demoPanels = [
  {
    group: "project",
    position: "left",
    id: "project-panel",
    label: "Project",
    icon: "folder_open",
    title: "Loaded Models",
    toggle: "RB_ProjectPanel",
    body: bodyProject,
  },
  {
    group: "spatial-structure",
    position: "left",
    id: "spatial-panel",
    label: "Spatial",
    icon: "account_tree",
    title: "Project Spatial Structure",
    body: bodySpatial,
  },
  {
    group: "filters",
    position: "left",
    id: "filters-panel",
    label: "Filters",
    icon: "filter_list",
    title: "Filters",
    body: bodyFilters,
  },
  {
    group: "selection-sets",
    position: "left",
    id: "selection-sets-panel",
    label: "Sets",
    icon: "bookmark",
    title: "Selection Sets",
    body: bodySelectionSets,
  },
  {
    group: "layers",
    position: "left",
    id: "layers-panel",
    label: "Layers",
    icon: "layers",
    title: "Layers",
    body: bodyLayers,
  },
  {
    group: "properties",
    position: "right",
    id: "properties-panel",
    label: "Properties",
    icon: "tune",
    title: "Properties",
    toggle: "RB_PropertiesPanel",
    body: bodyProperties,
  },
  {
    group: "console",
    position: "bottom",
    id: "console-panel",
    label: "Console",
    icon: "terminal",
    title: "Console",
    toggle: "RB_ConsolePanel",
    body: bodyConsole,
  },
];

export function startTemplatesDemo() {
  const world = new World(worldConfig);

  world.root.addClass("World");
  world.mount(document.body);

  const layout = new Layout(layoutConfig).init(world);

  for (const { body, ...options } of demoPanels) {
    createWorkspacePanel(layout, options, body());
  }

  mountViewport();
}
