import { DrawUI, GanttComponent, Nodes, TabPanel } from "drawui";
import { PieMenu } from "drawui/overlays";

function afterAttach(element, fn) {
  requestAnimationFrame(() => {
    if (element.dom?.isConnected) {
      fn();
      return;
    }
    requestAnimationFrame(fn);
  });
  return element;
}

const SAMPLE_TASKS = [
  {
    pID: 1,
    pName: "Foundation",
    pStart: "2026-07-01",
    pEnd: "2026-07-10",
    pPlanStart: "2026-07-01",
    pPlanEnd: "2026-07-10",
    pClass: "gtaskblue",
    pLink: "",
    pMile: 0,
    pRes: "Site",
    pComp: 40,
    pGroup: 0,
    pParent: 0,
    pOpen: 1,
    pDepend: "",
    pCaption: "",
    pCost: 0,
    pNotes: "",
  },
  {
    pID: 2,
    pName: "Framing",
    pStart: "2026-07-08",
    pEnd: "2026-07-22",
    pPlanStart: "2026-07-08",
    pPlanEnd: "2026-07-22",
    pClass: "gtaskblue",
    pLink: "",
    pMile: 0,
    pRes: "Carpenters",
    pComp: 10,
    pGroup: 0,
    pParent: 0,
    pOpen: 1,
    pDepend: "1",
    pCaption: "",
    pCost: 0,
    pNotes: "",
  },
  {
    pID: 3,
    pName: "Handover",
    pStart: "2026-07-22",
    pEnd: "2026-07-22",
    pPlanStart: "2026-07-22",
    pPlanEnd: "2026-07-22",
    pClass: "gmilestone",
    pLink: "",
    pMile: 1,
    pRes: "PM",
    pComp: 0,
    pGroup: 0,
    pParent: 0,
    pOpen: 1,
    pDepend: "2",
    pCaption: "",
    pCost: 0,
    pNotes: "",
  },
];

const CHART_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const CHART_PALETTE = [
  "rgba(86, 156, 214, 0.7)",
  "rgba(78, 201, 176, 0.7)",
  "rgba(220, 220, 170, 0.7)",
  "rgba(206, 145, 120, 0.7)",
  "rgba(197, 134, 192, 0.7)",
];
const CHART_BORDERS = [
  "rgb(86, 156, 214)",
  "rgb(78, 201, 176)",
  "rgb(220, 220, 170)",
  "rgb(206, 145, 120)",
  "rgb(197, 134, 192)",
];

const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true },
  },
};

/**
 * @param {Object} chartConfiguration
 * @param {string} [height]
 */
function makeChart(chartConfiguration, height = "260px") {
  const chart = DrawUI.chart({
    height,
    chartConfiguration: {
      ...chartConfiguration,
      options: {
        ...defaultChartOptions,
        ...chartConfiguration.options,
        plugins: {
          ...defaultChartOptions.plugins,
          ...chartConfiguration.options?.plugins,
        },
      },
    },
  });
  return afterAttach(chart, () => chart.init());
}

/** @type {Record<string, () => import("drawui").UIElement>} */
export const FULL_DEMO_BUILDERS = {
  "chart-bar": () =>
    makeChart({
      type: "bar",
      data: {
        labels: CHART_LABELS,
        datasets: [
          {
            label: "Tickets",
            data: [12, 19, 8, 15, 22],
            backgroundColor: CHART_PALETTE[0],
            borderColor: CHART_BORDERS[0],
            borderWidth: 1,
          },
        ],
      },
    }),

  "chart-bar-horizontal": () =>
    makeChart({
      type: "bar",
      data: {
        labels: ["Design", "Build", "Test", "Ship"],
        datasets: [
          {
            label: "Hours",
            data: [32, 48, 24, 16],
            backgroundColor: CHART_PALETTE[1],
            borderColor: CHART_BORDERS[1],
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
      },
    }),

  "chart-bar-stacked": () =>
    makeChart({
      type: "bar",
      data: {
        labels: CHART_LABELS,
        datasets: [
          {
            label: "Open",
            data: [8, 11, 5, 9, 12],
            backgroundColor: CHART_PALETTE[0],
            borderColor: CHART_BORDERS[0],
            borderWidth: 1,
          },
          {
            label: "Closed",
            data: [4, 8, 3, 6, 10],
            backgroundColor: CHART_PALETTE[1],
            borderColor: CHART_BORDERS[1],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          x: { stacked: true },
          y: { stacked: true },
        },
      },
    }),

  "chart-line": () =>
    makeChart({
      type: "line",
      data: {
        labels: CHART_LABELS,
        datasets: [
          {
            label: "Latency (ms)",
            data: [42, 38, 51, 45, 33],
            borderColor: CHART_BORDERS[0],
            backgroundColor: CHART_PALETTE[0],
            tension: 0.3,
          },
        ],
      },
    }),

  "chart-line-multi": () =>
    makeChart({
      type: "line",
      data: {
        labels: CHART_LABELS,
        datasets: [
          {
            label: "API",
            data: [42, 38, 51, 45, 33],
            borderColor: CHART_BORDERS[0],
            backgroundColor: CHART_PALETTE[0],
            tension: 0.3,
          },
          {
            label: "UI",
            data: [28, 31, 27, 34, 29],
            borderColor: CHART_BORDERS[1],
            backgroundColor: CHART_PALETTE[1],
            tension: 0.3,
          },
        ],
      },
    }),

  "chart-area": () =>
    makeChart({
      type: "line",
      data: {
        labels: CHART_LABELS,
        datasets: [
          {
            label: "Active users",
            data: [120, 145, 132, 168, 190],
            borderColor: CHART_BORDERS[2],
            backgroundColor: "rgba(220, 220, 170, 0.35)",
            fill: true,
            tension: 0.35,
          },
        ],
      },
    }),

  "chart-pie": () =>
    makeChart({
      type: "pie",
      data: {
        labels: ["Docs", "Code", "Review", "Meetings", "Other"],
        datasets: [
          {
            data: [28, 35, 18, 12, 7],
            backgroundColor: CHART_PALETTE,
            borderColor: CHART_BORDERS,
            borderWidth: 1,
          },
        ],
      },
    }),

  "chart-doughnut": () =>
    makeChart({
      type: "doughnut",
      data: {
        labels: ["Passed", "Failed", "Skipped"],
        datasets: [
          {
            data: [72, 18, 10],
            backgroundColor: [CHART_PALETTE[1], CHART_PALETTE[3], CHART_PALETTE[2]],
            borderColor: [CHART_BORDERS[1], CHART_BORDERS[3], CHART_BORDERS[2]],
            borderWidth: 1,
          },
        ],
      },
    }),

  "chart-polar-area": () =>
    makeChart({
      type: "polarArea",
      data: {
        labels: ["Speed", "Reliability", "UX", "Docs", "Support"],
        datasets: [
          {
            data: [11, 16, 14, 9, 12],
            backgroundColor: CHART_PALETTE,
            borderColor: CHART_BORDERS,
            borderWidth: 1,
          },
        ],
      },
    }),

  "chart-radar": () =>
    makeChart({
      type: "radar",
      data: {
        labels: ["Speed", "Reliability", "UX", "Docs", "Support"],
        datasets: [
          {
            label: "Current",
            data: [65, 78, 72, 55, 68],
            borderColor: CHART_BORDERS[0],
            backgroundColor: "rgba(86, 156, 214, 0.25)",
          },
          {
            label: "Target",
            data: [80, 85, 80, 75, 80],
            borderColor: CHART_BORDERS[1],
            backgroundColor: "rgba(78, 201, 176, 0.2)",
          },
        ],
      },
    }),

  "chart-scatter": () =>
    makeChart({
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Samples",
            data: [
              { x: 2, y: 14 },
              { x: 4, y: 9 },
              { x: 6, y: 18 },
              { x: 8, y: 12 },
              { x: 10, y: 22 },
              { x: 12, y: 16 },
            ],
            backgroundColor: CHART_PALETTE[0],
            borderColor: CHART_BORDERS[0],
          },
        ],
      },
      options: {
        scales: {
          x: { title: { display: true, text: "Effort" } },
          y: { title: { display: true, text: "Impact" } },
        },
      },
    }),

  "chart-bubble": () =>
    makeChart({
      type: "bubble",
      data: {
        datasets: [
          {
            label: "Initiatives",
            data: [
              { x: 20, y: 30, r: 8 },
              { x: 35, y: 45, r: 14 },
              { x: 50, y: 25, r: 10 },
              { x: 65, y: 55, r: 18 },
              { x: 80, y: 40, r: 12 },
            ],
            backgroundColor: CHART_PALETTE[4],
            borderColor: CHART_BORDERS[4],
          },
        ],
      },
      options: {
        scales: {
          x: { title: { display: true, text: "Cost" } },
          y: { title: { display: true, text: "Value" } },
        },
      },
    }),

  "chart-mixed": () =>
    makeChart({
      data: {
        labels: CHART_LABELS,
        datasets: [
          {
            type: "bar",
            label: "Volume",
            data: [12, 19, 8, 15, 22],
            backgroundColor: CHART_PALETTE[0],
            borderColor: CHART_BORDERS[0],
            borderWidth: 1,
            order: 2,
          },
          {
            type: "line",
            label: "Trend",
            data: [10, 14, 12, 16, 20],
            borderColor: CHART_BORDERS[3],
            backgroundColor: CHART_PALETTE[3],
            tension: 0.3,
            order: 1,
          },
        ],
      },
    }),

  "spreadsheet": () => {
    const sheet = DrawUI.spreadsheet({
      height: "280px",
      data: [
        { name: "Ada Lovelace", role: "Analyst", score: 98 },
        { name: "Alan Turing", role: "Engineer", score: 95 },
        { name: "Grace Hopper", role: "Lead", score: 97 },
      ],
      columnNameMapper: {
        name: "Name",
        role: "Role",
        score: "Score",
      },
    });

    return afterAttach(sheet, () => sheet.init());
  },

  "gantt": () => {
    const host = DrawUI.div()
      .setStyle("height", ["320px"])
      .setStyle("overflow", ["auto"])
      .setStyle("width", ["100%"]);

    const gantt = new GanttComponent({});
    gantt.render(SAMPLE_TASKS, host);
    return host;
  },

  "nodes": () => {
    const host = DrawUI.div()
      .setStyle("height", ["420px"])
      .setStyle("display", ["flex"])
      .setStyle("flexDirection", ["column"])
      .setStyle("width", ["100%"]);

    const nodes = new Nodes({
      embedded: true,
      nodes: [
        { id: 1, name: "Source", status: "Active", level: 0, parent: 0, children: [2, 3] },
        { id: 2, name: "Transform", status: "Pending", level: 1, parent: 1, children: [4] },
        { id: 3, name: "Validate", status: "Active", level: 1, parent: 1, children: [4] },
        { id: 4, name: "Output", status: "Done", level: 2, parent: 2, children: [] },
      ],
      connections: [
        { source: 1, sourceHandle: "output", target: 2, targetHandle: "input" },
        { source: 1, sourceHandle: "output", target: 3, targetHandle: "input" },
        { source: 2, sourceHandle: "output", target: 4, targetHandle: "input" },
        { source: 3, sourceHandle: "output", target: 4, targetHandle: "input" },
      ],
      onEdit: (node) => alert(`Edit node: ${node.name}`),
    });

    host.add(nodes);
    return host;
  },

  "tab-panel": () => {
    const wrap = DrawUI.column().gap("0.75rem");

    let panel = null;

    const openButton = DrawUI.button("Open floating tab panel")
      .addClass("primary")
      .onClick(() => {
        if (!panel) {
          panel = new TabPanel({
            context: { ui: { model: {} } },
            tabId: "gallery-demo-tab",
            tabLabel: "Demo panel",
            icon: "tab",
            title: "Floating tab panel",
            startFloating: true,
            floatingStyles: { width: "320px", height: "260px" },
          });
          panel.content.add(
            DrawUI.column()
              .gap("0.5rem")
              .setStyle("padding", ["0.75rem"])
              .add(DrawUI.text("TabPanel content — dock buttons appear when a LayoutManager context is provided."))
              .add(DrawUI.badge("startFloating: true")),
          );
        }
        panel.show();
      });

    wrap.add(openButton);
    wrap.add(
      DrawUI.smallText(
        "Without a LayoutManager the panel opens as a floating window; inside a workspace it docks as a left/right/bottom tab.",
      ),
    );
    return wrap;
  },

  "pie-menu": () => {
    const wrap = DrawUI.column().gap("0.75rem");

    const status = DrawUI.smallText("Last action: none");

    const viewport = DrawUI.div()
      .setStyle("position", ["relative"])
      .setStyle("height", ["340px"])
      .setStyle("border", ["1px dashed var(--dui-color-border, #444)"])
      .setStyle("borderRadius", ["8px"])
      .setStyle("overflow", ["hidden"]);

    const hint = DrawUI.smallText("Hover this area and press P, or use the button below.");
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

    const menu = new PieMenu({
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

    const toggleButton = DrawUI.button("Toggle pie menu")
      .addClass("primary")
      .onClick(() => menu.toggle());

    wrap.add(viewport);
    wrap.add(DrawUI.row().gap("0.75rem").setStyle("alignItems", ["center"]).add(toggleButton).add(status));
    return wrap;
  },

  "markdown-full": () =>
    DrawUI.markdown(
      [
        "Full build renders GitHub-flavored markdown via **Showdown**, with optional",
        "Highlight.js for fenced code. Inline *italic*, **bold**, ~~strikethrough~~,",
        "and `inline code` all work.",
        "",
        "## Feature matrix",
        "",
        "| Feature | Supported | Notes |",
        "| --- | --- | --- |",
        "| Tables | yes | Pipe tables with header row |",
        "| Task lists | yes | Checkboxes below |",
        "| Fenced code | yes | Highlight.js when available |",
        "| Autolinks | yes | https://github.com/myoualid/drawui |",
        "| Emoji | yes | :sparkles: :rocket: |",
        "",
        "## Lists & tasks",
        "",
        "- Nested lists",
        "  - Second level",
        "  - Another item",
        "- Ordered next",
        "",
        "1. Install peers",
        "2. Call `DrawUI.markdown(text)`",
        "3. Attach to the DOM",
        "",
        "- [x] Headings and paragraphs",
        "- [x] Bold / italic / strike",
        "- [x] Tables and task lists",
        "- [x] Highlighted code blocks",
        "",
        "## Quote",
        "",
        "> Prefer the full build when you need GFM tables, task lists, or syntax-highlighted",
        "> fences. The min build keeps a small built-in converter instead.",
        "",
        "## Code",
        "",
        "```js",
        "import { DrawUI } from \"drawui\";",
        "",
        "const md = DrawUI.markdown(",
        "  \"# Hello\\n\\n**Showdown** + Highlight.js\",",
        "  { isMarkdown: true },",
        ");",
        "",
        "document.body.appendChild(md.dom);",
        "```",
        "",
        "```css",
        ".Markdown pre {",
        "  overflow-x: auto;",
        "}",
        "```",
      ].join("\n"),
      { isMarkdown: true },
    ),
};
