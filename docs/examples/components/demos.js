import * as GUI from "ifcopenshell/gui";
import { RadialMenu } from "ifcopenshell/gui";

function row() {
  return new GUI.StackPanel({ isVertical: false }).gap("0.75rem").setStyle("flexWrap", ["wrap"]).setStyle("alignItems", ["center"]);
}

/** @type {Record<string, () => import("ifcopenshell/gui").Control>} */
export const DEMO_BUILDERS = {
  "headings": () =>
    new GUI.StackPanel({ isVertical: true })
      .gap("0.25rem")
      .add(new GUI.Heading(1, "Heading 1"))
      .add(new GUI.Heading(2, "Heading 2"))
      .add(new GUI.Heading(3, "Heading 3"))
      .add(new GUI.Heading(4, "Heading 4"))
      .add(new GUI.Heading(5, "Heading 5"))
      .add(new GUI.Heading(6, "Heading 6")),

  "title": () => new GUI.Title("Panel title style"),

  "text": () => new GUI.Text("Inline text"),

  "small-text": () => new GUI.Caption("Small text via GUI.caption()"),

  "disclaimer": () => new GUI.Disclaimer("Disclaimer copy for secondary legal or helper text."),

  "markdown": () =>
    new GUI.Markdown(
      [
        "## Min-build markdown",
        "",
        "Built-in converter — **no Showdown**. Supports headings, **bold**, *italic*,",
        "`inline code`, lists, and fenced blocks.",
        "",
        "- Item one",
        "- Item two",
        "",
        "1. Ordered",
        "2. Lists",
        "",
        "```js",
        "new Markdown(\"# Hello\");",
        "```",
      ].join("\n"),
    ),

  "badge": () => new GUI.Badge("Badge"),

  "kbd": () => new GUI.Kbd("Ctrl"),

  "code": () => new GUI.Code("new Button()"),

  "image": () =>
    new GUI.Image(
      "data:image/svg+xml," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="8" fill="#70ba35"/></svg>',
        ),
    ).setStyle("width", ["4rem"]),

  "svg": () =>
    new GUI.Svg(
      "data:image/svg+xml," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>',
        ),
    )
      .setStyle("width", ["3rem"])
      .setStyle("height", ["3rem"])
      .setStyle("color", ["var(--dui-color-accent, #70ba35)"]),

  "canvas": () => {
    const canvas = new GUI.Canvas();
    canvas.dom.width = 240;
    canvas.dom.height = 120;
    canvas
      .setStyle("border", ["1px solid var(--dui-color-border, #444)"])
      .setStyle("borderRadius", ["var(--dui-radius, 4px)"]);
    const ctx = canvas.dom.getContext("2d");
    ctx.fillStyle = "#70ba35";
    ctx.fillRect(16, 16, 88, 88);
    ctx.fillStyle = "#e8e8e8";
    ctx.font = "14px sans-serif";
    ctx.fillText("Canvas", 120, 70);
    return canvas;
  },

  "inline-link": () => new GUI.Hyperlink("GUI docs", "#", "open_in_new", false),

  "icons-grid": () => {
    const grid = new GUI.Grid().addClass("Gallery-iconGrid");
    grid.setStyle("display", ["grid"]);
    grid.setStyle("gridTemplateColumns", ["repeat(auto-fill, minmax(5.5rem, 1fr))"]);
    grid.setStyle("gap", ["0.75rem"]);

    Object.entries(GUI.ICONS).forEach(([key, name]) => {
      grid.add(
        new GUI.StackPanel({ isVertical: true })
          .addClass("Gallery-iconCell")
          .setStyle("alignItems", ["center"])
          .setStyle("gap", ["0.25rem"])
          .setStyle("padding", ["0.5rem"])
          .add(new GUI.Icon(name))
          .add(new GUI.Caption(key)),
      );
    });

    return grid;
  },

  "operator": () => new GUI.Operator("settings"),

  "divider": () =>
    new GUI.StackPanel({ isVertical: true })
      .gap("0.5rem")
      .add(new GUI.Text("Above the rule"))
      .add(new GUI.Line())
      .add(new GUI.Text("Below the rule")),

  "line-break": () =>
    new GUI.StackPanel({ isVertical: true })
      .gap("0.25rem")
      .add(new GUI.Text("Line one"))
      .add(new GUI.LineBreak())
      .add(new GUI.Text("Line two")),

  "row": () =>
    new GUI.StackPanel({ isVertical: false })
      .gap("0.5rem")
      .add(new GUI.Badge("Row"))
      .add(new GUI.Badge("Layout")),

  "column": () =>
    new GUI.StackPanel({ isVertical: true })
      .gap("0.25rem")
      .add(new GUI.Text("Column A"))
      .add(new GUI.Text("Column B")),

  "grid": () => {
    const grid = new GUI.Grid();
    grid.setStyle("display", ["grid"]);
    grid.setStyle("gridTemplateColumns", ["repeat(3, 1fr)"]);
    grid.setStyle("gap", ["0.5rem"]);
    ["A", "B", "C"].forEach((label) => {
      grid.add(
        new GUI.Card()
          .add(new GUI.Text(label))
          .setStyle("padding", ["0.5rem"])
          .setStyle("textAlign", ["center"]),
      );
    });
    return grid;
  },

  "hspacer": () =>
    row()
      .add(new GUI.Text("Start"))
      .add(new GUI.HSpacer("2rem"))
      .add(new GUI.Text("End")),

  "spacer": () =>
    new GUI.StackPanel({ isVertical: true })
      .add(new GUI.Text("Above"))
      .add(new GUI.Spacer("1rem"))
      .add(new GUI.Text("Below")),

  "handle": () =>
    row()
      .add(
        new GUI.Card()
          .setStyle("padding", ["0.5rem 0.75rem"])
          .setStyle("display", ["flex"])
          .setStyle("alignItems", ["center"])
          .setStyle("gap", ["0.5rem"])
          .add(
            new GUI.Handle("drag")
              .add(new GUI.Icon("drag_indicator"))
              .setStyle("cursor", ["grab"])
              .setStyle("color", ["var(--dui-color-text-muted, #999)"]),
          )
          .add(new GUI.Text("Draggable row")),
      ),

  "ribbon-bar": () =>
    new GUI.RibbonBar(
      [
        new GUI.Button("Project").setIcon("folder_open"),
        new GUI.Button("Properties").setIcon("tune").addClass("selected"),
        new GUI.Button("Console").setIcon("terminal"),
      ],
      "flex-start",
    ),

  "day-night": () => {
    const context = {
      config: { ui: { theme: { current: "night", default: "night" } } },
      signals: {
        themeChanged: {
          add() {},
        },
      },
    };
    const ops = {
      execute(_cmd, ctx, theme) {
        document.documentElement.dataset.theme = theme === "day" ? "light" : "dark";
        ctx.config.ui.theme.current = theme;
      },
    };
    return new GUI.ThemeToggle(context, ops);
  },

  "split-container": () => {
    const left = new GUI.Rectangle()
      .add(new GUI.Text("Left pane"))
      .setStyle("padding", ["0.75rem"])
      .setStyle("flex", ["1"]);
    const right = new GUI.Rectangle()
      .add(new GUI.Text("Right pane"))
      .setStyle("padding", ["0.75rem"])
      .setStyle("flex", ["1"]);
    const split = new GUI.SplitContainer("horizontal", [left, right]);
    split.setStyle("height", ["7rem"]);
    return split;
  },

  "card": () =>
    new GUI.Card()
      .add(new GUI.Text("new Card()"))
      .setStyle("padding", ["0.75rem"]),

  "panel": () =>
    new GUI.Rectangle()
      .add(new GUI.Text("GUI.rectangle()"))
      .setStyle("padding", ["0.75rem"]),

  "div": () =>
    new GUI.Container()
      .add(new GUI.Text("GUI.container() — generic block container"))
      .setStyle("padding", ["0.75rem"]),

  "center": () => {
    const host = new GUI.Container().setStyle("minHeight", ["4rem"]);
    host.add(GUI.center(new GUI.Badge("Centered via center()")));
    return host;
  },

  "form-composed": () => {
    const nameInput = new GUI.InputText();
    nameInput.dom.placeholder = "Jane Doe";
    const emailInput = new GUI.InputText();
    emailInput.dom.placeholder = "jane@example.com";
    emailInput.dom.type = "email";
    const notes = new GUI.InputTextArea();
    notes.dom.placeholder = "Optional notes…";
    const roleSelect = new GUI.InputDropdown().setOptions({ user: "User", admin: "Admin", editor: "Editor" });
    const actions = new GUI.StackPanel({ isVertical: false })
      .gap("0.5rem")
      .add(new GUI.Button("Cancel").addClass("secondary"))
      .add(new GUI.Button("Save").addClass("primary"));
    return new GUI.Form()
      .setStyle("display", ["flex"])
      .setStyle("flexDirection", ["column"])
      .gap("0.5rem")
      .add(new GUI.Text("Name"))
      .add(nameInput)
      .add(new GUI.Text("Email"))
      .add(emailInput)
      .add(new GUI.Text("Role"))
      .add(roleSelect)
      .add(new GUI.Text("Notes"))
      .add(notes)
      .add(
        new GUI.StackPanel({ isVertical: false })
          .gap("0.5rem")
          .add(new GUI.Checkbox(true).addClass("Card-checkbox"))
          .add(new GUI.Text("Email me updates")),
      )
      .add(new GUI.Spacer("0.5rem"))
      .add(actions);
  },

  "input": () => {
    const field = new GUI.InputText();
    field.dom.placeholder = "Enter value…";
    return field;
  },

  "textarea": () => {
    const field = new GUI.InputTextArea();
    field.dom.placeholder = "Multi-line notes…";
    return field;
  },

  "select": () => new GUI.InputDropdown().setOptions({ user: "User", admin: "Admin" }),

  "checkbox": () =>
    row()
      .add(new GUI.Checkbox(true).addClass("Card-checkbox"))
      .add(new GUI.Text("Agree to terms")),

  "number": () => new GUI.InputNumber(2),

  "integer": () => new GUI.InputInteger(1),

  "slider": () => new GUI.Slider(42).setRange(0, 100).setStep(1).setPrecision(0),

  "color": () => new GUI.InputColor(),

  "progress": () => new GUI.ProgressBar(0.65),

  "date": () => new GUI.InputDate(new Date()),

  "button-primary": () => new GUI.Button("Primary").addClass("primary"),

  "button-secondary": () => new GUI.Button("Secondary").addClass("secondary"),

  "search-input": () =>
    new GUI.InputSearch("Search layers…", (value) => {
      console.log("search:", value);
    }),

  "list": () => {
    const list = new GUI.InputList();
    list.setItems([
      { id: "layer-01", name: "Layer 01" },
      { id: "layer-02", name: "Layer 02" },
      { id: "layer-03", name: "Layer 03" },
    ]);
    return list;
  },

  "reorderable-list": () =>
    new GUI.SortableList(
      [{ label: "Wall", checked: true }, { label: "Slab", checked: false }, { label: "Column" }, { label: "Beam" }],
      (items) => console.log("reordered", items),
    ).container,

  "drill-down": () => {
    const sampleTree = {
      name: "Project",
      children: [
        {
          name: "Site",
          children: [
            { name: "Building A", children: [{ name: "Level 01" }, { name: "Level 02" }] },
            { name: "Building B" },
          ],
        },
        { name: "Library", children: [{ name: "Materials" }, { name: "Profiles" }] },
      ],
    };
    const drill = new GUI.NavigationList({
      getLabel: (item) => item.name,
      getChildren: (item) => item.children || [],
      onItemClick: (item) => console.log("selected", item),
      onNavigate: (item, direction) => console.log("navigate", direction, item.name),
    });
    drill.setData(sampleTree);
    return drill.panel;
  },

  "tree-view": () => {
    const sampleTree = {
      name: "Project",
      children: [
        {
          name: "Site",
          children: [
            { name: "Building A", children: [{ name: "Level 01" }, { name: "Level 02" }] },
            { name: "Building B" },
          ],
        },
        { name: "Library", children: [{ name: "Materials" }, { name: "Profiles" }] },
      ],
    };
    const tree = new GUI.TreeView({
      getLabel: (item) => item.name,
      getChildren: (item) => item.children || [],
      onItemClick: (item) => console.log("selected", item),
    });
    tree.setData(sampleTree);
    return tree.panel;
  },

  "labeled-box-item": () => {
    const menuList = new GUI.InputList();
    menuList.add(
      new GUI.LabeledBoxItem({ id: "visibility", label: "Visibility", checked: true }, {
        visibility: "visibility",
        default: "layers",
      }),
    );
    menuList.add(
      new GUI.LabeledBoxItem({ id: "materials", label: "Materials", checked: false }, {
        materials: "palette",
        default: "layers",
      }),
    );
    return menuList;
  },

  "property-row": () => {
    const nameField = new GUI.InputText().setValue("Custom");
    return new GUI.StackPanel({ isVertical: true })
      .addClass("PropertyGrid")
      .add(new GUI.PropertyGridRow("Label", nameField, "Editable value cell"))
      .add(new GUI.PropertyGridRow("Status", "Ready"));
  },

  "property-table": () => {
    const nameField = new GUI.InputText().setValue("Beam-12");
    const typeSelect = new GUI.InputDropdown().setOptions({
      IfcBeam: "IfcBeam",
      IfcColumn: "IfcColumn",
      IfcSlab: "IfcSlab",
    }).setValue("IfcBeam");
    const notes = new GUI.InputTextArea().setValue("Primary span member");
    notes.dom.rows = 2;
    const visible = new GUI.Checkbox(true).addClass("Card-checkbox");
    const length = new GUI.InputNumber(12.5).setRange(0, 100).setUnit("m");
    const count = new GUI.InputInteger(4).setRange(0, 99);
    const opacity = new GUI.Slider(0.75).setRange(0, 1).setStep(0.01).setPrecision(2);
    const color = new GUI.InputColor().setValue("#70ba35");
    const created = new GUI.InputDate(new Date());
    const progress = new GUI.ProgressBar(0.45);

    return new GUI.PropertyGrid({
      compact: true,
      title: "All value types",
      rows: {
        staticText: { label: "Text", value: "IfcBeam" },
        name: { label: "Input", value: nameField },
        type: { label: "Select", value: typeSelect },
        notes: { label: "Textarea", value: notes },
        visible: { label: "Checkbox", value: visible },
        length: { label: "Number", value: length },
        count: { label: "Integer", value: count },
        opacity: { label: "Slider", value: opacity },
        color: { label: "Color", value: color },
        created: { label: "Date", value: created },
        progress: { label: "Progress", value: progress },
      },
    });
  },

  "tabbed-panel": () => {
    const tabs = new GUI.TabView();
    tabs.addTab("tab-a", "Overview", [new GUI.Text("Tab A content")]);
    tabs.addTab("tab-b", "Details", [new GUI.Text("Tab B content")]);
    tabs.select("tab-a");
    return tabs;
  },

  "collapsible-section": () => {
    const section = new GUI.CollapsiblePanel({ title: "Parameters", icon: "tune" });
    section.content(new GUI.Text("Section body"));
    return section;
  },

  "collapsible-panel": () => {
    const host = new GUI.Container().setStyle("position", ["relative"]).setStyle("minHeight", ["5rem"]);
    const panel = new GUI.Flyout({
      title: "Alerts",
      icon: "notifications",
      badgeCount: 2,
      position: { top: "0.5rem", right: "0.5rem" },
    });
    panel.content(new GUI.StackPanel({ isVertical: true }).add(new GUI.Text("Collapsible panel content")));
    host.add(panel);
    return host;
  },

  "sidebar-layout": () => {
    const host = new GUI.Container().setStyle("height", ["260px"]).setStyle("overflow", ["hidden"]);
    const layout = new GUI.NavigationView({
      sidebarWidth: "180px",
      sidebarMinWidth: "140px",
      sidebarMaxWidth: "320px",
      sidebarResizable : true,
    });
    layout.setSidebarTitle("Explorer");
    layout.setSidebarContent(
      new GUI.StackPanel({ isVertical: true })
        .gap("0.25rem")
        .add(new GUI.Text("Site"))
        .add(new GUI.Text("Building")),
    );
    layout.setMainContent(
      new GUI.StackPanel({ isVertical: true })
        .gap("0.5rem")
        .add(new GUI.Heading(3, "Viewport"))
        .add(new GUI.Text("Main content")),
    );
    host.add(layout);
    return host;
  },

  "layout-pane": () => {
    const host = new GUI.Container()
      .setStyle("height", ["160px"])
      .setStyle("overflow", ["hidden"]);

    const pane = new GUI.ScrollViewer({ fill: true, scrollable: true, className: "PanelContent" });
    pane.add(
      new GUI.StackPanel({ isVertical: true })
        .gap("0.25rem")
        .add(new GUI.Text("Scrollable region"))
        .add(new GUI.Text("Line 2"))
        .add(new GUI.Text("Line 3"))
        .add(new GUI.Text("Line 4"))
        .add(new GUI.Text("Line 5")),
    );
    host.add(pane);
    return host;
  },

  "base-panel": () => {
    return new GUI.Panel()
      .header("Inspector", "info")
      .add(new GUI.Text("Panel content area"))
      .add(
        new GUI.StackPanel({ isVertical: false })
          .gap("0.5rem")
          .add(new GUI.Button("Action").addClass("primary"))
          .add(new GUI.Button("Cancel").addClass("secondary")),
      );
  },

  "spinner": () => new GUI.LoadingCube({ text: "Loading model…" }),

  "tooltip": () => {
    const target = new GUI.Button("Hover for tooltip").addClass("secondary");
    new GUI.Tooltip("Saved to cloud", { theme: "dark" }).attachTo(target);
    return target;
  },

  "toast": () =>
    new GUI.Button("Show toast").addClass("primary").onClick(() => {
      new GUI.Toast("Changes saved", "success", { duration: 2500 });
    }),

  "loading-bar-component": () => {
    const loadingHost = new GUI.Container().setStyle("position", ["relative"]).setStyle("minHeight", ["2.5rem"]);
    const loadingBar = new GUI.StatusBar({ initialText: "Processing…" });
    loadingHost.add(loadingBar);
    loadingHost.add(
      new GUI.Button("Run StatusBar").addClass("secondary").onClick(() => {
        loadingBar.show();
        loadingBar.update(0.35, "Step 1/3");
        setTimeout(() => loadingBar.update(0.7, "Step 2/3"), 600);
        setTimeout(() => loadingBar.update(1, "Done"), 1200);
        setTimeout(() => loadingBar.hide(), 1800);
      }),
    );
    return loadingHost;
  },

  "progress-helpers": () => {
    const inlineHost = new GUI.Container();
    inlineHost.dom.id = "inline-progress-host";
    inlineHost.setStyle("position", ["relative"]).setStyle("minHeight", ["3rem"]);
    const toast = new GUI.Toast();

    return new GUI.StackPanel({ isVertical: true })
      .gap("0.75rem")
      .add(
        new GUI.Button("Run inline progress").addClass("secondary").onClick(() => {
          toast.show("#inline-progress-host", "Exporting…");
          let pct = 0;
          const timer = setInterval(() => {
            pct += 10;
            toast.update(pct, `${pct}%`);
            if (pct >= 100) {
              clearInterval(timer);
              setTimeout(() => toast.hide(), 400);
            }
          }, 120);
        }),
      )
      .add(inlineHost);
  },

  "floating-window": () =>
    new GUI.Button("Open FloatingDialog").addClass("secondary").onClick(() => {
      document.querySelectorAll(".FloatingWindow, .Header").forEach((node) => {
        const shell = node.closest(".FloatingWindow") || node.closest(".Rectangle");
        if (shell?.parentElement === document.body) shell.remove();
      });
      const win = new GUI.FloatingDialog({ title: "Floating window", icon: "info" });
      win
        .content(new GUI.Text("GUI.floatingDialog() content"))
        .add(
          new GUI.Button("Close")
            .addClass("secondary")
            .onClick(() => win.destroy()),
        )
        .show();
    }),

  "floating-panel": () =>
    new GUI.Button("Open FloatingWindow").addClass("secondary").onClick(() => {
      document.querySelectorAll(".FloatingWindow").forEach((node) => {
        if (node.parentElement === document.body) node.remove();
      });
      const panel = new GUI.FloatingWindow({ title: "Overlay", width: "320px" });
      panel.setContent(
        new GUI.StackPanel({ isVertical: true })
          .gap("0.5rem")
          .add(new GUI.Heading(3, "FloatingWindow"))
          .add(new GUI.Text("Free-floating overlay panel")),
      );
      panel.dom.style.height = "auto";
      panel.dom.style.maxHeight = "70vh";
      panel.show();
    }),

  "pie-menu": () => {
    const wrap = new GUI.StackPanel({ isVertical: true }).gap("0.75rem");

    const status = new GUI.Caption("Last action: none");

    const viewport = new GUI.Container()
      .setStyle("position", ["relative"])
      .setStyle("height", ["340px"])
      .setStyle("border", ["1px dashed var(--dui-color-border, #444)"])
      .setStyle("borderRadius", ["8px"])
      .setStyle("overflow", ["hidden"]);

    const hint = new GUI.Caption("Hover this area and press P, or use the button below.");
    hint.setStyle("position", ["absolute"]);
    hint.setStyle("top", ["0.5rem"]);
    hint.setStyle("left", ["0.75rem"]);
    viewport.add(hint);

    const operators = {
      canExecute: () => true,
      execute: async (operatorId) => {
        status.setTextContent(`Last action: ${operatorId}`);
      },
    };

    const menu = new RadialMenu({
      viewport: viewport.dom,
      operators,
      items: [
        { operator: "demo.select_all", icon: "select_all", name: "Select all" },
        { operator: "demo.duplicate", icon: "content_copy", name: "Duplicate" },
        { operator: "demo.group", icon: "category", name: "Group" },
        { operator: "demo.hide", icon: "visibility_off", name: "Hide" },
        { operator: "demo.delete", icon: "delete", name: "Delete" },
      ],
    });

    const toggleButton = new GUI.Button("Toggle pie menu")
      .addClass("primary")
      .onClick(() => menu.toggle());

    wrap.add(viewport);
    wrap.add(new GUI.StackPanel({ isVertical: false }).gap("0.75rem").setStyle("alignItems", ["center"]).add(toggleButton).add(status));
    return wrap;
  },
};

export const DEMO_IDS = Object.keys(DEMO_BUILDERS);
