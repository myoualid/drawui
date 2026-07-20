import {
  WorkspacePanel,
  WorkspaceLayout,
  buildWorldFromConfig,
  StackPanel,
  Container,
  Heading,
  TextBlock,
  Caption,
  Badge,
  Card,
  Button,
  IconButton,
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
  Label,
  Form,
  Line,
  Spacer,
  TabView,
  TreeView,
  NavigationList,
  SortableList,
  LabeledBoxItem,
  PropertyGrid,
  InstructionPanel,
  ThemeToggle,
  Toast,
  FloatingWindow,
  CollapsiblePanel,
  RibbonBar,
  Code,
  Kbd,
  Hyperlink,
} from "drawui";
import { layoutConfig, worldConfig } from "./world-config.js";

function createSignal(listeners, name) {
  const subs = new Set();
  return {
    add(fn) {
      subs.add(fn);
    },
    remove(fn) {
      subs.delete(fn);
    },
    dispatch(payload) {
      if (!listeners.has(name)) return;
      for (const fn of subs) fn(payload);
    },
  };
}

/** Minimal app context for WorkspacePanel + WorkspaceLayout + ThemeToggle. */
function createContext(layoutManager) {
  const listeners = new Set();
  const signals = {
    layoutTabChanged: createSignal(listeners, "layoutTabChanged"),
    layoutTabAdded: createSignal(listeners, "layoutTabAdded"),
    layoutTabRemoved: createSignal(listeners, "layoutTabRemoved"),
    layoutWorkspaceChanged: createSignal(listeners, "layoutWorkspaceChanged"),
    themeChanged: createSignal(listeners, "themeChanged"),
  };

  return {
    config: {
      ui: {
        WorldComponent: worldConfig,
        layout: layoutConfig,
        theme: { current: "night", default: "night" },
      },
    },
    ui: { model: { layoutManager } },
    signals,
    addListeners: (names) => {
      for (const name of names) listeners.add(name);
    },
  };
}

function createWorkspacePanel(context, options, body) {
  const panel = new WorkspacePanel({
    context,
    position: options.position,
    moduleId: options.moduleId,
    ownerId: options.ownerId,
    tabId: options.tabId,
    tabLabel: options.tabLabel,
    icon: options.icon,
    title: options.title,
    floatable: options.floatable ?? true,
    autoShow: options.autoShow ?? true,
  });
  // Same path as CollapsiblePanel: body goes straight into PanelContent.
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
        new Button("Add model").addClass("primary"),
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
    .add(new Label("Category"))
    .add(category)
    .add(new Label("Opacity"))
    .add(opacity)
    .add(
      row(
        new Checkbox(true).addClass("Card-checkbox"),
        new TextBlock("Hide openings"),
      ),
    )
    .add(
      row(
        new Checkbox(false).addClass("Card-checkbox"),
        new TextBlock("Isolate selection"),
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
        new IconButton("Export", { icon: "download", meta: ".json" }),
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
    title: "Identity",
    rows: {
      name: { label: "Name", value: nameField },
      type: { label: "Type", value: typeSelect },
      guid: { label: "GlobalId", value: "2x3$Abc…" },
      notes: { label: "Notes", value: notes },
    },
  });

  const appearance = new PropertyGrid({
    compact: true,
    title: "Appearance",
    rows: {
      visible: { label: "Visible", value: new Checkbox(true).addClass("Card-checkbox") },
      length: { label: "Length", value: new InputNumber(12.5).setRange(0, 100).setUnit("m") },
      count: { label: "Count", value: new InputInteger(4).setRange(0, 99) },
      opacity: {
        label: "Opacity",
        value: new Slider(0.75).setRange(0, 1).setStep(0.01).setPrecision(2),
      },
      color: { label: "Color", value: new InputColor().setValue("#70ba35") },
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
    .add(new Code("[10:02:12] WorkspaceLayout.init(\"World\")"))
    .add(new Code("[10:02:13] 7 WorkspacePanels registered"))
    .add(new TextBlock("Ready — open panels from the ribbon or toggle bar."));

  const output = new StackPanel({ isVertical: true })
    .gap("0.5rem")
    .add(new Caption("Operator output"))
    .add(new TextBlock("Last run: theme.change_to → night"))
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
        new TextBlock("+ J toggles bottom workspace"),
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
      .add(new TextBlock("IfcBeam · Level 01"))
      .add(new Badge("selected"))
      .add(new Line())
      .add(new Button("Focus").addClass("primary")),
  );
  win.dom.style.height = "auto";
  win.show();
}

function mountViewport(context) {
  const viewport = document.getElementById("Viewport");
  if (!viewport) return;

  const themeOps = {
    execute(_cmd, ctx, theme) {
      document.documentElement.dataset.theme = theme === "day" ? "light" : "dark";
      ctx.config.ui.theme.current = theme;
      ctx.signals.themeChanged.dispatch(theme);
    },
  };

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
            new IconButton("Select", { icon: "near_me" }),
            new IconButton("Measure", { icon: "straighten" }),
            new IconButton("Section", { icon: "crop" }),
            new IconButton("Settings", { icon: "settings" }),
          ],
          "flex-start",
        ),
      )
      .add(
        new InstructionPanel("Controls", "3d_rotation", [
          ["MMB", "Orbit"],
          ["Shift + MMB", "Pan"],
          ["Scroll", "Zoom"],
        ]),
      ),
  );

  const shell = new Card()
    .addClass("templates-viewport-card")
    .padding("1rem")
    .add(
      new StackPanel({ isVertical: true })
        .gap("0.75rem")
        .add(
          row(
            new Heading(3, "Viewport"),
            new ThemeToggle(context, themeOps),
            new Button("Float panel").addClass("secondary").onClick(openSelectionFloat),
          ),
        )
        .add(
          new Caption(
            "Center #Viewport — InstructionPanel, CollapsiblePanel, ThemeToggle, FloatingWindow.",
          ),
        )
        .add(tools),
    );

  const host = new Container()
    .addClass("templates-viewport")
    .setStyles({
      position: "absolute",
      inset: "0",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "1.25rem",
      boxSizing: "border-box",
      pointerEvents: "none",
      overflow: "auto",
    });
  shell.setStyle("pointerEvents", ["auto"]);
  host.add(shell);
  viewport.appendChild(host.dom);
}

/* ── Boot ─────────────────────────────────────────────────────── */

const demoPanels = [
  {
    moduleId: "project",
    position: "left",
    tabId: "project-panel",
    tabLabel: "Project",
    icon: "folder_open",
    title: "Loaded Models",
    body: bodyProject,
  },
  {
    ownerId: "spatial-structure",
    position: "left",
    tabId: "spatial-panel",
    tabLabel: "Spatial",
    icon: "account_tree",
    title: "Project Spatial Structure",
    body: bodySpatial,
  },
  {
    ownerId: "filters",
    position: "left",
    tabId: "filters-panel",
    tabLabel: "Filters",
    icon: "filter_list",
    title: "Filters",
    body: bodyFilters,
  },
  {
    ownerId: "selection-sets",
    position: "left",
    tabId: "selection-sets-panel",
    tabLabel: "Sets",
    icon: "bookmark",
    title: "Selection Sets",
    body: bodySelectionSets,
  },
  {
    ownerId: "layers",
    position: "left",
    tabId: "layers-panel",
    tabLabel: "Layers",
    icon: "layers",
    title: "Layers",
    body: bodyLayers,
  },
  {
    moduleId: "properties",
    position: "right",
    tabId: "properties-panel",
    tabLabel: "Properties",
    icon: "tune",
    title: "Properties",
    body: bodyProperties,
  },
  {
    moduleId: "console",
    position: "bottom",
    tabId: "console-panel",
    tabLabel: "Console",
    icon: "terminal",
    title: "Console",
    body: bodyConsole,
  },
];

export function startTemplatesDemo() {
  const knownModuleIds = new Set(["project", "properties", "console"]);
  const { root, mount } = buildWorldFromConfig(worldConfig, document.body, {
    knownModuleIds,
    activeModuleIds: [...knownModuleIds],
  });

  root.addClass("World");
  mount(document.body);

  const layoutManager = new WorkspaceLayout(layoutConfig).init("World");
  const context = createContext(layoutManager);

  for (const { body, ...options } of demoPanels) {
    createWorkspacePanel(context, options, body());
  }

  mountViewport(context);
}
