import * as DrawUI from "drawui";

function row() {
  return new DrawUI.StackPanel({ isVertical: false }).gap("0.75rem").setStyle("flexWrap", ["wrap"]).setStyle("alignItems", ["center"]);
}

/** @type {Record<string, () => import("drawui").Control>} */
export const DEMO_BUILDERS = {
  "headings": () =>
    new DrawUI.StackPanel({ isVertical: true })
      .gap("0.25rem")
      .add(new DrawUI.Heading(1, "Heading 1"))
      .add(new DrawUI.Heading(2, "Heading 2"))
      .add(new DrawUI.Heading(3, "Heading 3"))
      .add(new DrawUI.Heading(4, "Heading 4"))
      .add(new DrawUI.Heading(5, "Heading 5"))
      .add(new DrawUI.Heading(6, "Heading 6")),

  "title": () => new DrawUI.Title("Panel title style"),

  "text": () => new DrawUI.TextBlock("Body text via DrawUI.textBlock()"),

  "small-text": () => new DrawUI.Caption("Small text via DrawUI.caption()"),

  "paragraph": () => new DrawUI.Paragraph("Paragraph with inline content."),

  "disclaimer": () => new DrawUI.Disclaimer("Disclaimer copy for secondary legal or helper text."),

  "markdown": () =>
    new DrawUI.Markdown(
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

  "badge": () => new DrawUI.Badge("Badge"),

  "kbd": () => new DrawUI.Kbd("Ctrl"),

  "code": () => new DrawUI.Code("new Button()"),

  "span": () => new DrawUI.Span().setTextContent("Inline span"),

  "image": () =>
    new DrawUI.Image(
      "data:image/svg+xml," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="8" fill="#70ba35"/></svg>',
        ),
    ).setStyle("width", ["4rem"]),

  "svg": () =>
    new DrawUI.Svg(
      "data:image/svg+xml," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>',
        ),
    )
      .setStyle("width", ["3rem"])
      .setStyle("height", ["3rem"])
      .setStyle("color", ["var(--dui-color-accent, #70ba35)"]),

  "canvas": () => {
    const canvas = new DrawUI.Canvas();
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

  "inline-link": () => new DrawUI.Hyperlink("DrawUI docs", "#", "open_in_new", false),

  "icons-grid": () => {
    const grid = new DrawUI.Grid().addClass("Gallery-iconGrid");
    grid.setStyle("display", ["grid"]);
    grid.setStyle("gridTemplateColumns", ["repeat(auto-fill, minmax(5.5rem, 1fr))"]);
    grid.setStyle("gap", ["0.75rem"]);

    Object.entries(DrawUI.ICONS).forEach(([key, name]) => {
      grid.add(
        new DrawUI.StackPanel({ isVertical: true })
          .addClass("Gallery-iconCell")
          .setStyle("alignItems", ["center"])
          .setStyle("gap", ["0.25rem"])
          .setStyle("padding", ["0.5rem"])
          .add(new DrawUI.Icon(name))
          .add(new DrawUI.Caption(key)),
      );
    });

    return grid;
  },

  "operator": () => new DrawUI.Operator("settings"),

  "divider": () =>
    new DrawUI.StackPanel({ isVertical: true })
      .gap("0.5rem")
      .add(new DrawUI.TextBlock("Above the rule"))
      .add(new DrawUI.Line())
      .add(new DrawUI.TextBlock("Below the rule")),

  "line-break": () =>
    new DrawUI.StackPanel({ isVertical: true })
      .gap("0.25rem")
      .add(new DrawUI.TextBlock("Line one"))
      .add(new DrawUI.LineBreak())
      .add(new DrawUI.TextBlock("Line two")),

  "row": () =>
    new DrawUI.StackPanel({ isVertical: false })
      .gap("0.5rem")
      .add(new DrawUI.Badge("Row"))
      .add(new DrawUI.Badge("Layout")),

  "column": () =>
    new DrawUI.StackPanel({ isVertical: true })
      .gap("0.25rem")
      .add(new DrawUI.TextBlock("Column A"))
      .add(new DrawUI.TextBlock("Column B")),

  "grid": () => {
    const grid = new DrawUI.Grid();
    grid.setStyle("display", ["grid"]);
    grid.setStyle("gridTemplateColumns", ["repeat(3, 1fr)"]);
    grid.setStyle("gap", ["0.5rem"]);
    ["A", "B", "C"].forEach((label) => {
      grid.add(
        new DrawUI.Card()
          .add(new DrawUI.TextBlock(label))
          .setStyle("padding", ["0.5rem"])
          .setStyle("textAlign", ["center"]),
      );
    });
    return grid;
  },

  "hspacer": () =>
    row()
      .add(new DrawUI.TextBlock("Start"))
      .add(new DrawUI.HSpacer("2rem"))
      .add(new DrawUI.TextBlock("End")),

  "spacer": () =>
    new DrawUI.StackPanel({ isVertical: true })
      .add(new DrawUI.TextBlock("Above"))
      .add(new DrawUI.Spacer("1rem"))
      .add(new DrawUI.TextBlock("Below")),

  "handle": () =>
    row()
      .add(
        new DrawUI.Card()
          .setStyle("padding", ["0.5rem 0.75rem"])
          .setStyle("display", ["flex"])
          .setStyle("alignItems", ["center"])
          .setStyle("gap", ["0.5rem"])
          .add(
            new DrawUI.Handle("drag")
              .add(new DrawUI.Icon("drag_indicator"))
              .setStyle("cursor", ["grab"])
              .setStyle("color", ["var(--dui-color-text-muted, #999)"]),
          )
          .add(new DrawUI.TextBlock("Draggable row")),
      ),

  "header": () =>
    new DrawUI.Header({
      title: "Inspector",
      icon: "info",
      actions: [new DrawUI.Button("…").addClass("secondary")],
    }),

  "ribbon-button": () =>
    new DrawUI.RibbonButton("Project", { icon: "folder_open" }),

  "ribbon-bar": () =>
    new DrawUI.RibbonBar(
      [
        new DrawUI.RibbonButton("Project", { icon: "folder_open" }),
        new DrawUI.RibbonButton("Properties", { icon: "tune", active: true }),
        new DrawUI.RibbonButton("Console", { icon: "terminal" }),
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
    return new DrawUI.ThemeToggle(context, ops);
  },

  "split-container": () => {
    const left = new DrawUI.Rectangle()
      .add(new DrawUI.TextBlock("Left pane"))
      .setStyle("padding", ["0.75rem"])
      .setStyle("flex", ["1"]);
    const right = new DrawUI.Rectangle()
      .add(new DrawUI.TextBlock("Right pane"))
      .setStyle("padding", ["0.75rem"])
      .setStyle("flex", ["1"]);
    const split = new DrawUI.SplitContainer("horizontal", [left, right]);
    split.setStyle("height", ["7rem"]);
    return split;
  },

  "card": () =>
    new DrawUI.Card()
      .add(new DrawUI.TextBlock("new Card()"))
      .setStyle("padding", ["0.75rem"]),

  "panel": () =>
    new DrawUI.Rectangle()
      .add(new DrawUI.TextBlock("DrawUI.rectangle()"))
      .setStyle("padding", ["0.75rem"]),

  "div": () =>
    new DrawUI.Container()
      .add(new DrawUI.TextBlock("DrawUI.container() — generic block container"))
      .setStyle("padding", ["0.75rem"]),

  "center": () => {
    const host = new DrawUI.Container().setStyle("minHeight", ["4rem"]);
    host.add(DrawUI.center(new DrawUI.Badge("Centered via center()")));
    return host;
  },

  "form-composed": () => {
    const nameInput = new DrawUI.InputText();
    nameInput.dom.placeholder = "Jane Doe";
    const emailInput = new DrawUI.InputText();
    emailInput.dom.placeholder = "jane@example.com";
    emailInput.dom.type = "email";
    const notes = new DrawUI.InputTextArea();
    notes.dom.placeholder = "Optional notes…";
    const roleSelect = new DrawUI.InputDropdown().setOptions({ user: "User", admin: "Admin", editor: "Editor" });
    const actions = new DrawUI.StackPanel({ isVertical: false })
      .gap("0.5rem")
      .add(new DrawUI.Button("Cancel").addClass("secondary"))
      .add(new DrawUI.Button("Save").addClass("primary"));
    return new DrawUI.Form()
      .setStyle("display", ["flex"])
      .setStyle("flexDirection", ["column"])
      .gap("0.5rem")
      .add(new DrawUI.Label("Name"))
      .add(nameInput)
      .add(new DrawUI.Label("Email"))
      .add(emailInput)
      .add(new DrawUI.Label("Role"))
      .add(roleSelect)
      .add(new DrawUI.Label("Notes"))
      .add(notes)
      .add(
        new DrawUI.StackPanel({ isVertical: false })
          .gap("0.5rem")
          .add(new DrawUI.Checkbox(true).addClass("Card-checkbox"))
          .add(new DrawUI.TextBlock("Email me updates")),
      )
      .add(new DrawUI.Spacer("0.5rem"))
      .add(actions);
  },

  "input": () => {
    const field = new DrawUI.InputText();
    field.dom.placeholder = "Enter value…";
    return field;
  },

  "textarea": () => {
    const field = new DrawUI.InputTextArea();
    field.dom.placeholder = "Multi-line notes…";
    return field;
  },

  "select": () => new DrawUI.InputDropdown().setOptions({ user: "User", admin: "Admin" }),

  "label": () => new DrawUI.Label("Field label"),

  "checkbox": () =>
    row()
      .add(new DrawUI.Checkbox(true).addClass("Card-checkbox"))
      .add(new DrawUI.TextBlock("Agree to terms")),

  "number": () => new DrawUI.InputNumber(2),

  "integer": () => new DrawUI.InputInteger(1),

  "slider": () => new DrawUI.Slider(42).setRange(0, 100).setStep(1).setPrecision(0),

  "color": () => new DrawUI.InputColor(),

  "progress": () => new DrawUI.ProgressBar(0.65),

  "date": () => new DrawUI.InputDate(new Date()),

  "button-primary": () => new DrawUI.Button("Primary").addClass("primary"),

  "button-secondary": () => new DrawUI.Button("Secondary").addClass("secondary"),

  "square-button": () => new DrawUI.IconButton("Export", { icon: "download", meta: ".ifc" }),

  "compact-button": () => new DrawUI.ToolbarButton("Action"),

  "search-input": () =>
    new DrawUI.InputSearch("Search layers…", (value) => {
      console.log("search:", value);
    }),

  "list": () => {
    const list = new DrawUI.InputList();
    list.setItems([
      { id: "layer-01", name: "Layer 01" },
      { id: "layer-02", name: "Layer 02" },
      { id: "layer-03", name: "Layer 03" },
    ]);
    return list;
  },

  "reorderable-list": () =>
    new DrawUI.SortableList(
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
    const drill = new DrawUI.NavigationList({
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
    const tree = new DrawUI.TreeView({
      getLabel: (item) => item.name,
      getChildren: (item) => item.children || [],
      onItemClick: (item) => console.log("selected", item),
    });
    tree.setData(sampleTree);
    return tree.panel;
  },

  "labeled-box-item": () => {
    const menuList = new DrawUI.InputList();
    menuList.add(
      new DrawUI.LabeledBoxItem({ id: "visibility", label: "Visibility", checked: true }, {
        visibility: "visibility",
        default: "layers",
      }),
    );
    menuList.add(
      new DrawUI.LabeledBoxItem({ id: "materials", label: "Materials", checked: false }, {
        materials: "palette",
        default: "layers",
      }),
    );
    return menuList;
  },

  "property-row": () => {
    const nameField = new DrawUI.InputText().setValue("Custom");
    return new DrawUI.StackPanel({ isVertical: true })
      .addClass("PropertyGrid")
      .add(new DrawUI.PropertyGridRow("Label", nameField, "Editable value cell"))
      .add(new DrawUI.PropertyGridRow("Status", "Ready"));
  },

  "property-table": () => {
    const nameField = new DrawUI.InputText().setValue("Beam-12");
    const typeSelect = new DrawUI.InputDropdown().setOptions({
      IfcBeam: "IfcBeam",
      IfcColumn: "IfcColumn",
      IfcSlab: "IfcSlab",
    }).setValue("IfcBeam");
    const notes = new DrawUI.InputTextArea().setValue("Primary span member");
    notes.dom.rows = 2;
    const visible = new DrawUI.Checkbox(true).addClass("Card-checkbox");
    const length = new DrawUI.InputNumber(12.5).setRange(0, 100).setUnit("m");
    const count = new DrawUI.InputInteger(4).setRange(0, 99);
    const opacity = new DrawUI.Slider(0.75).setRange(0, 1).setStep(0.01).setPrecision(2);
    const color = new DrawUI.InputColor().setValue("#70ba35");
    const created = new DrawUI.InputDate(new Date());
    const progress = new DrawUI.ProgressBar(0.45);

    return new DrawUI.PropertyGrid({
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

  "instruction-panel": () =>
    new DrawUI.InstructionPanel("Viewport", "3d_rotation", [
      ["MMB", "Orbit around the scene"],
      ["Shift + MMB", "Pan the view"],
      ["Scroll", "Zoom in / out"],
      ["Alt + MMB", "Roll the camera"],
    ]),

  "tabbed-panel": () => {
    const tabs = new DrawUI.TabView();
    tabs.addTab("tab-a", "Overview", [new DrawUI.TextBlock("Tab A content")]);
    tabs.addTab("tab-b", "Details", [new DrawUI.TextBlock("Tab B content")]);
    tabs.select("tab-a");
    return tabs;
  },

  "collapsible-section": () => {
    const section = new DrawUI.CollapsiblePanel({ title: "Parameters", icon: "tune" });
    section.content(new DrawUI.TextBlock("Section body built with DrawUI.textBlock()"));
    return section;
  },

  "collapsible-panel": () => {
    const host = new DrawUI.Container().setStyle("position", ["relative"]).setStyle("minHeight", ["5rem"]);
    const panel = new DrawUI.Flyout({
      title: "Alerts",
      icon: "notifications",
      badgeCount: 2,
      position: { top: "0.5rem", right: "0.5rem" },
    });
    panel.content(new DrawUI.StackPanel({ isVertical: true }).add(new DrawUI.TextBlock("Collapsible panel content")));
    host.add(panel);
    return host;
  },

  "sidebar-layout": () => {
    const host = new DrawUI.Container().setStyle("height", ["260px"]).setStyle("overflow", ["hidden"]);
    const layout = new DrawUI.NavigationView({
      sidebarWidth: "180px",
      sidebarMinWidth: "140px",
      sidebarMaxWidth: "320px",
      sidebarResizable : true,
    });
    layout.setSidebarTitle("Explorer");
    layout.setSidebarContent(
      new DrawUI.StackPanel({ isVertical: true })
        .gap("0.25rem")
        .add(new DrawUI.TextBlock("Site"))
        .add(new DrawUI.TextBlock("Building")),
    );
    layout.setMainContent(
      new DrawUI.StackPanel({ isVertical: true })
        .gap("0.5rem")
        .add(new DrawUI.Heading(3, "Viewport"))
        .add(new DrawUI.TextBlock("Main content")),
    );
    host.add(layout);
    return host;
  },

  "layout-pane": () => {
    const host = new DrawUI.Container()
      .setStyle("height", ["160px"])
      .setStyle("overflow", ["hidden"])
      .addClass("Panel");

    const pane = new DrawUI.ScrollViewer({ fill: true, scrollable: true, className: "PanelContent" });
    pane.add(
      new DrawUI.StackPanel({ isVertical: true })
        .gap("0.25rem")
        .add(new DrawUI.TextBlock("Scrollable region"))
        .add(new DrawUI.TextBlock("Line 2"))
        .add(new DrawUI.TextBlock("Line 3"))
        .add(new DrawUI.TextBlock("Line 4"))
        .add(new DrawUI.TextBlock("Line 5")),
    );
    host.add(pane);
    return host;
  },

  "base-panel": () => {
    return new DrawUI.ContentPanel()
      .header("Inspector", "info")
      .add(new DrawUI.TextBlock("ContentPanel content area"))
      .add(
        new DrawUI.StackPanel({ isVertical: false })
          .gap("0.5rem")
          .add(new DrawUI.Button("Action").addClass("primary"))
          .add(new DrawUI.Button("Cancel").addClass("secondary")),
      );
  },

  "spinner": () => new DrawUI.ProgressRing({ text: "Loading model…" }),

  "tooltip": () => {
    const target = new DrawUI.Button("Hover for tooltip").addClass("secondary");
    new DrawUI.Tooltip("Saved to cloud", { theme: "dark" }).attachTo(target);
    return target;
  },

  "toast": () =>
    new DrawUI.Button("Show toast").addClass("primary").onClick(() => {
      new DrawUI.Toast("Changes saved", "success", { duration: 2500 });
    }),

  "loading-bar-component": () => {
    const loadingHost = new DrawUI.Container().setStyle("position", ["relative"]).setStyle("minHeight", ["2.5rem"]);
    const loadingBar = new DrawUI.StatusBar({ initialText: "Processing…" });
    loadingHost.add(loadingBar);
    loadingHost.add(
      new DrawUI.Button("Run StatusBar").addClass("secondary").onClick(() => {
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
    const inlineHost = new DrawUI.Container();
    inlineHost.dom.id = "inline-progress-host";
    inlineHost.setStyle("position", ["relative"]).setStyle("minHeight", ["3rem"]);
    const toast = new DrawUI.Toast();

    return new DrawUI.StackPanel({ isVertical: true })
      .gap("0.75rem")
      .add(
        new DrawUI.Button("Run inline progress").addClass("secondary").onClick(() => {
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
    new DrawUI.Button("Open FloatingDialog").addClass("secondary").onClick(() => {
      document.querySelectorAll(".FloatingWindow, .Header").forEach((node) => {
        const shell = node.closest(".FloatingWindow") || node.closest(".Rectangle");
        if (shell?.parentElement === document.body) shell.remove();
      });
      const win = new DrawUI.FloatingDialog({ title: "Floating window", icon: "info" });
      win
        .content(new DrawUI.TextBlock("DrawUI.floatingDialog() content"))
        .add(
          new DrawUI.Button("Close")
            .addClass("secondary")
            .onClick(() => win.destroy()),
        )
        .show();
    }),

  "floating-panel": () =>
    new DrawUI.Button("Open FloatingWindow").addClass("secondary").onClick(() => {
      document.querySelectorAll(".FloatingWindow").forEach((node) => {
        if (node.parentElement === document.body) node.remove();
      });
      const panel = new DrawUI.FloatingWindow({ title: "Overlay", width: "320px" });
      panel.setContent(
        new DrawUI.StackPanel({ isVertical: true })
          .gap("0.5rem")
          .add(new DrawUI.Heading(3, "FloatingWindow"))
          .add(new DrawUI.TextBlock("Free-floating overlay panel")),
      );
      panel.dom.style.height = "auto";
      panel.dom.style.maxHeight = "70vh";
      panel.show();
    }),

  "pie-menu": () => {
    const wrap = new DrawUI.StackPanel({ isVertical: true }).gap("0.75rem");

    const status = new DrawUI.Caption("Last action: none");

    const viewport = new DrawUI.Container()
      .setStyle("position", ["relative"])
      .setStyle("height", ["340px"])
      .setStyle("border", ["1px dashed var(--dui-color-border, #444)"])
      .setStyle("borderRadius", ["8px"])
      .setStyle("overflow", ["hidden"]);

    const hint = new DrawUI.Caption("Hover this area and press P, or use the button below.");
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

    const menu = new DrawUI.RadialMenu({
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

    const toggleButton = new DrawUI.Button("Toggle pie menu")
      .addClass("primary")
      .onClick(() => menu.toggle());

    wrap.add(viewport);
    wrap.add(new DrawUI.StackPanel({ isVertical: false }).gap("0.75rem").setStyle("alignItems", ["center"]).add(toggleButton).add(status));
    return wrap;
  },
};

export const DEMO_IDS = Object.keys(DEMO_BUILDERS);
