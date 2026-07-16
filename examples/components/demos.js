import {
  DrawUI,
  ICONS,
  LoadingBar,
  FloatingPanel,
  showProgressBar,
  updateProgressBar,
  hideProgressBar,
} from "drawui";

function row() {
  return DrawUI.row().gap("0.75rem").setStyle("flexWrap", ["wrap"]).setStyle("alignItems", ["center"]);
}

/** @type {Record<string, () => import("drawui").UIElement>} */
export const DEMO_BUILDERS = {
  "headings": () =>
    DrawUI.column()
      .gap("0.25rem")
      .add(DrawUI.h1("Heading 1"))
      .add(DrawUI.h2("Heading 2"))
      .add(DrawUI.h3("Heading 3"))
      .add(DrawUI.h4("Heading 4"))
      .add(DrawUI.h5("Heading 5"))
      .add(DrawUI.h6("Heading 6")),

  "title": () => DrawUI.title("Panel title style"),

  "text": () => DrawUI.text("Body text via DrawUI.text()"),

  "small-text": () => DrawUI.smallText("Small text via DrawUI.smallText()"),

  "paragraph": () => DrawUI.paragraph("Paragraph with inline content."),

  "disclaimer": () => DrawUI.disclaimer("Disclaimer copy for secondary legal or helper text."),

  "markdown": () =>
    DrawUI.markdown(
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
        "DrawUI.markdown(\"# Hello\");",
        "```",
      ].join("\n"),
    ),

  "badge": () => DrawUI.badge("Badge"),

  "kbd": () => DrawUI.kbd("Ctrl"),

  "inline-link": () => DrawUI.link("DrawUI docs", "#", "open_in_new", false),

  "icons-grid": () => {
    const grid = DrawUI.grid().addClass("Gallery-iconGrid");
    grid.setStyle("display", ["grid"]);
    grid.setStyle("gridTemplateColumns", ["repeat(auto-fill, minmax(5.5rem, 1fr))"]);
    grid.setStyle("gap", ["0.75rem"]);

    Object.entries(ICONS).forEach(([key, name]) => {
      grid.add(
        DrawUI.column()
          .addClass("Gallery-iconCell")
          .setStyle("alignItems", ["center"])
          .setStyle("gap", ["0.25rem"])
          .setStyle("padding", ["0.5rem"])
          .add(DrawUI.icon(name))
          .add(DrawUI.smallText(key)),
      );
    });

    return grid;
  },

  "operator": () => DrawUI.operator("settings"),

  "divider": () =>
    DrawUI.column()
      .gap("0.5rem")
      .add(DrawUI.text("Above the rule"))
      .add(DrawUI.divider())
      .add(DrawUI.text("Below the rule")),

  "line-break": () =>
    DrawUI.column()
      .gap("0.25rem")
      .add(DrawUI.text("Line one"))
      .add(DrawUI.lineBreak())
      .add(DrawUI.text("Line two")),

  "row": () =>
    DrawUI.row()
      .gap("0.5rem")
      .add(DrawUI.badge("Row"))
      .add(DrawUI.badge("Layout")),

  "column": () =>
    DrawUI.column()
      .gap("0.25rem")
      .add(DrawUI.text("Column A"))
      .add(DrawUI.text("Column B")),

  "grid": () => {
    const grid = DrawUI.grid();
    grid.setStyle("display", ["grid"]);
    grid.setStyle("gridTemplateColumns", ["repeat(3, 1fr)"]);
    grid.setStyle("gap", ["0.5rem"]);
    ["A", "B", "C"].forEach((label) => {
      grid.add(
        DrawUI.card()
          .add(DrawUI.text(label))
          .setStyle("padding", ["0.5rem"])
          .setStyle("textAlign", ["center"]),
      );
    });
    return grid;
  },

  "hspacer": () =>
    row()
      .add(DrawUI.text("Start"))
      .add(DrawUI.hspacer("2rem"))
      .add(DrawUI.text("End")),

  "spacer": () =>
    DrawUI.column()
      .add(DrawUI.text("Above"))
      .add(DrawUI.spacer("1rem"))
      .add(DrawUI.text("Below")),

  "split-container": () => {
    const left = DrawUI.panel()
      .add(DrawUI.text("Left pane"))
      .setStyle("padding", ["0.75rem"])
      .setStyle("flex", ["1"]);
    const right = DrawUI.panel()
      .add(DrawUI.text("Right pane"))
      .setStyle("padding", ["0.75rem"])
      .setStyle("flex", ["1"]);
    const split = DrawUI.splitContainer("horizontal", [left, right]);
    split.setStyle("height", ["7rem"]);
    return split;
  },

  "card": () =>
    DrawUI.card()
      .add(DrawUI.text("DrawUI.card()"))
      .setStyle("padding", ["0.75rem"]),

  "panel": () =>
    DrawUI.panel()
      .add(DrawUI.text("DrawUI.panel()"))
      .setStyle("padding", ["0.75rem"]),

  "div": () =>
    DrawUI.div()
      .add(DrawUI.text("DrawUI.div() — generic block container"))
      .setStyle("padding", ["0.75rem"]),

  "center": () => {
    const host = DrawUI.div().setStyle("minHeight", ["4rem"]);
    host.add(DrawUI.center(DrawUI.badge("Centered via DrawUI.center()")));
    return host;
  },

  "form-composed": () => {
    const nameInput = DrawUI.input();
    nameInput.dom.placeholder = "Jane Doe";
    const emailInput = DrawUI.input();
    emailInput.dom.placeholder = "jane@example.com";
    emailInput.dom.type = "email";
    const notes = DrawUI.textarea();
    notes.dom.placeholder = "Optional notes…";
    const roleSelect = DrawUI.select().setOptions({ user: "User", admin: "Admin", editor: "Editor" });
    const actions = DrawUI.row()
      .gap("0.5rem")
      .add(DrawUI.button("Cancel").addClass("secondary"))
      .add(DrawUI.button("Save").addClass("primary"));
    return DrawUI.form()
      .setStyle("display", ["flex"])
      .setStyle("flexDirection", ["column"])
      .gap("0.5rem")
      .add(DrawUI.label("Name"))
      .add(nameInput)
      .add(DrawUI.label("Email"))
      .add(emailInput)
      .add(DrawUI.label("Role"))
      .add(roleSelect)
      .add(DrawUI.label("Notes"))
      .add(notes)
      .add(
        DrawUI.row()
          .gap("0.5rem")
          .add(DrawUI.checkbox(true))
          .add(DrawUI.text("Email me updates")),
      )
      .add(DrawUI.spacer("0.5rem"))
      .add(actions);
  },

  "input": () => {
    const field = DrawUI.input();
    field.dom.placeholder = "Enter value…";
    return field;
  },

  "textarea": () => {
    const field = DrawUI.textarea();
    field.dom.placeholder = "Multi-line notes…";
    return field;
  },

  "select": () => DrawUI.select().setOptions({ user: "User", admin: "Admin" }),

  "label": () => DrawUI.label("Field label"),

  "checkbox": () =>
    row()
      .add(DrawUI.checkbox(true))
      .add(DrawUI.text("Agree to terms")),

  "number": () => DrawUI.number(2),

  "integer": () => DrawUI.integer(1),

  "slider": () => DrawUI.slider(42).setRange(0, 100).setStep(1).setPrecision(0),

  "color": () => DrawUI.color(),

  "progress": () => DrawUI.progress(0.65),

  "date": () => DrawUI.date(new Date()),

  "button-primary": () => DrawUI.button("Primary").addClass("primary"),

  "button-secondary": () => DrawUI.button("Secondary").addClass("secondary"),

  "square-button": () => DrawUI.squareButton("Export", { icon: "download", meta: ".ifc" }),

  "compact-field": () => DrawUI.compactField(DrawUI.compactButton("Compact")),

  "compact-button": () => DrawUI.compactButton("Action"),

  "search-input": () =>
    DrawUI.searchInput("Search layers…", (value) => {
      console.log("search:", value);
    }),

  "list": () => {
    const list = DrawUI.list();
    list.add(DrawUI.listItem("Layer 01"));
    list.add(DrawUI.listItem("Layer 02"));
    list.add(DrawUI.listItem("Layer 03"));
    return list;
  },

  "list-item": () => DrawUI.listItem("Standalone list row"),

  "reorderable-list": () =>
    DrawUI.reorderableList(
      [{ label: "Wall", checked: true }, { label: "Slab", checked: false }, { label: "Column" }, { label: "Beam" }],
      (items) => console.log("reordered", items),
    ),

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
    const drill = DrawUI.drillDownUpList({
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
    const tree = DrawUI.treeView({
      getLabel: (item) => item.name,
      getChildren: (item) => item.children || [],
      onItemClick: (item) => console.log("selected", item),
    });
    tree.setData(sampleTree);
    return tree.panel;
  },

  "labeled-box-item": () => {
    const menuList = DrawUI.list();
    menuList.add(
      DrawUI.labeledBoxItem({ id: "visibility", label: "Visibility", checked: true }, {
        visibility: "visibility",
        default: "layers",
      }),
    );
    menuList.add(
      DrawUI.labeledBoxItem({ id: "materials", label: "Materials", checked: false }, {
        materials: "palette",
        default: "layers",
      }),
    );
    return menuList;
  },

  "property-row": () => {
    const nameField = DrawUI.input().setValue("Custom");
    return DrawUI.column()
      .addClass("PropertyTable")
      .add(DrawUI.propertyRow("Label", nameField, "Editable value cell"))
      .add(DrawUI.propertyRow("Status", "Ready"));
  },

  "property-table": () => {
    const nameField = DrawUI.input().setValue("Beam-12");
    const typeSelect = DrawUI.select().setOptions({
      IfcBeam: "IfcBeam",
      IfcColumn: "IfcColumn",
      IfcSlab: "IfcSlab",
    }).setValue("IfcBeam");
    const notes = DrawUI.textarea().setValue("Primary span member");
    notes.dom.rows = 2;
    const visible = DrawUI.checkbox(true);
    const length = DrawUI.number(12.5).setRange(0, 100).setUnit("m");
    const count = DrawUI.integer(4).setRange(0, 99);
    const opacity = DrawUI.slider(0.75).setRange(0, 1).setStep(0.01).setPrecision(2);
    const color = DrawUI.color().setValue("#70ba35");
    const created = DrawUI.date(new Date());
    const progress = DrawUI.progress(0.45);

    return DrawUI.propertyTable({
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
    DrawUI.instructionPanel("Viewport", "3d_rotation", [
      ["MMB", "Orbit around the scene"],
      ["Shift + MMB", "Pan the view"],
      ["Scroll", "Zoom in / out"],
      ["Alt + MMB", "Roll the camera"],
    ]),

  "tabbed-panel": () => {
    const tabs = DrawUI.tabbedPanel();
    tabs.addTab("tab-a", "Overview", [DrawUI.text("Tab A content")]);
    tabs.addTab("tab-b", "Details", [DrawUI.text("Tab B content")]);
    tabs.select("tab-a");
    return tabs;
  },

  "collapsible-section": () => {
    const section = DrawUI.collapsibleSection({ title: "Parameters", icon: "tune" });
    section.setContent(DrawUI.text("Section body built with DrawUI.text()"));
    return section;
  },

  "collapsible-panel": () => {
    const host = DrawUI.div().setStyle("position", ["relative"]).setStyle("minHeight", ["5rem"]);
    const panel = DrawUI.collapsiblePanel({
      title: "Alerts",
      icon: "notifications",
      badgeCount: 2,
      position: { top: "0.5rem", right: "0.5rem" },
    });
    panel.setContent(DrawUI.column().add(DrawUI.text("Collapsible panel content")));
    host.add(panel);
    return host;
  },

  "sidebar-layout": () => {
    const host = DrawUI.div().setStyle("height", ["260px"]).setStyle("overflow", ["hidden"]);
    const layout = DrawUI.sidebarLayout({
      sidebarWidth: "180px",
      sidebarMinWidth: "140px",
      sidebarMaxWidth: "320px",
      sidebarResizable : true,
    });
    layout.setSidebarTitle("Explorer");
    layout.setSidebarContent(
      DrawUI.column()
        .gap("0.25rem")
        .add(DrawUI.text("Site"))
        .add(DrawUI.text("Building")),
    );
    layout.setMainContent(
      DrawUI.column()
        .gap("0.5rem")
        .add(DrawUI.h3("Viewport"))
        .add(DrawUI.text("Main content")),
    );
    host.add(layout);
    return host;
  },

  "layout-pane": () => {
    const host = DrawUI.div()
      .setStyle("height", ["160px"])
      .setStyle("overflow", ["hidden"])
      .addClass("Panel");

    const pane = DrawUI.layoutPane({ scrollable: true, className: "PanelContent" });
    pane.add(
      DrawUI.column()
        .gap("0.25rem")
        .add(DrawUI.text("Scrollable region"))
        .add(DrawUI.text("Line 2"))
        .add(DrawUI.text("Line 3"))
        .add(DrawUI.text("Line 4"))
        .add(DrawUI.text("Line 5")),
    );
    host.add(pane);
    return host;
  },

  "base-panel": () => {
    const base = DrawUI.basePanel();
    base.createHeader("Inspector", "info");
    base.content
      .gap("0.75rem")
      .add(DrawUI.text("BasePanel content area"))
      .add(
        DrawUI.row()
          .gap("0.5rem")
          .add(DrawUI.button("Action").addClass("primary"))
          .add(DrawUI.button("Cancel").addClass("secondary")),
      );
    return base.panel;
  },

  "spinner": () => DrawUI.spinner({ text: "Loading model…" }),

  "tooltip": () => {
    const target = DrawUI.button("Hover for tooltip").addClass("secondary");
    DrawUI.tooltip("Saved to cloud", { theme: "dark" }).attachTo(target);
    return target;
  },

  "toast": () =>
    DrawUI.button("Show toast").addClass("primary").onClick(() => {
      DrawUI.toast("Changes saved", "success", { duration: 2500 });
    }),

  "loading-bar-component": () => {
    const loadingHost = DrawUI.div().setStyle("position", ["relative"]).setStyle("minHeight", ["2.5rem"]);
    const loadingBar = new LoadingBar({ initialText: "Processing…" });
    loadingHost.add(loadingBar);
    loadingHost.add(
      DrawUI.button("Run LoadingBar").addClass("secondary").onClick(() => {
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
    const inlineHost = DrawUI.div();
    inlineHost.dom.id = "inline-progress-host";
    inlineHost.setStyle("position", ["relative"]).setStyle("minHeight", ["3rem"]);

    return DrawUI.column()
      .gap("0.75rem")
      .add(
        DrawUI.button("Run inline progress").addClass("secondary").onClick(() => {
          showProgressBar("#inline-progress-host", "Exporting…");
          let pct = 0;
          const timer = setInterval(() => {
            pct += 10;
            updateProgressBar(pct, `${pct}%`);
            if (pct >= 100) {
              clearInterval(timer);
              setTimeout(() => hideProgressBar(), 400);
            }
          }, 120);
        }),
      )
      .add(inlineHost);
  },

  "floating-window": () =>
    DrawUI.button("Open SimpleFloatingWindow").addClass("secondary").onClick(() => {
      document.querySelectorAll(".FloatingPanel, .PanelHeader").forEach((node) => {
        const shell = node.closest(".FloatingPanel") || node.closest(".Panel");
        if (shell?.parentElement === document.body) shell.remove();
      });
      const win = DrawUI.floatingWindow({ title: "Floating window", icon: "info" });
      win.content.clear();
      win.content.add(DrawUI.text("DrawUI.floatingWindow() content"));
      win.content.add(
        DrawUI.button("Close")
          .addClass("secondary")
          .onClick(() => win.destroy()),
      );
      win.show();
    }),

  "floating-panel": () =>
    DrawUI.button("Open FloatingPanel").addClass("secondary").onClick(() => {
      document.querySelectorAll(".FloatingPanel").forEach((node) => {
        if (node.parentElement === document.body) node.remove();
      });
      const panel = new FloatingPanel({ title: "Overlay", width: "320px" });
      panel.setContent(
        DrawUI.column()
          .gap("0.5rem")
          .add(DrawUI.h3("FloatingPanel"))
          .add(DrawUI.text("Free-floating overlay panel")),
      );
      panel.dom.style.height = "auto";
      panel.dom.style.maxHeight = "70vh";
      panel.show();
    }),
};

export const DEMO_IDS = Object.keys(DEMO_BUILDERS);
