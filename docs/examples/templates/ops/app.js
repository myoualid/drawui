import {
  SplitContainer,
  StackPanel,
  Container,
  Card,
  Heading,
  TextBlock,
  Caption,
  Badge,
  Button,
  IconButton,
  ThemeToggle,
  Toast,
  StatusBar,
  TabView,
  Chart,
  DataGrid,
  NodeGraph,
  InputSearch,
  Line,
  RibbonBar,
} from "drawui";

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

function row(...children) {
  return new StackPanel({ isVertical: false })
    .gap("0.5rem")
    .setStyle("alignItems", ["center"])
    .setStyle("flexWrap", ["wrap"])
    .add(...children);
}

function makeChart(config, height = "220px") {
  const chart = new Chart({
    height,
    chartConfiguration: {
      ...config,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } },
        ...config.options,
      },
    },
  });
  return afterAttach(chart, () => chart.init());
}

const INCIDENTS = [
  { id: "INC-1842", service: "api-gateway", severity: "SEV-2", age: "18m", commander: "R. Patel", status: "Investigating" },
  { id: "INC-1841", service: "billing-worker", severity: "SEV-3", age: "2h", commander: "L. Nguyen", status: "Mitigating" },
  { id: "INC-1839", service: "search-index", severity: "SEV-3", age: "1d", commander: "—", status: "Monitoring" },
  { id: "INC-1830", service: "cdn", severity: "SEV-4", age: "3d", commander: "—", status: "Resolved" },
];

const ALERTS = [
  { title: "api-gateway 5xx", detail: "Error rate 4.2% · us-east-1", tone: "firing" },
  { title: "billing lag", detail: "Queue depth 12k · p95 40s", tone: "warning" },
  { title: "search freshness", detail: "Index delay 9m", tone: "info" },
  { title: "cdn cache hit", detail: "Recovered to 94%", tone: "ok" },
];

function createThemeContext() {
  const listeners = new Set();
  return {
    config: { ui: { theme: { current: "night", default: "night" } } },
    signals: {
      themeChanged: {
        add(fn) {
          listeners.add(fn);
        },
        remove(fn) {
          listeners.delete(fn);
        },
        dispatch(theme) {
          for (const fn of listeners) fn(theme);
        },
      },
    },
  };
}

function buildHeader(context, themeOps, statusBar) {
  return new StackPanel({ isVertical: false })
    .addClass("ops-header")
    .gap("0.75rem")
    .setStyle("alignItems", ["center"])
    .setStyle("justifyContent", ["space-between"])
    .add(
      row(
        new Heading(3, "Ops board"),
        new Badge("2 active"),
        new Caption("prod · us-east-1"),
      ),
      row(
        new RibbonBar(
          [
            new IconButton("Ack", { icon: "check" }),
            new IconButton("Mute", { icon: "notifications_off" }),
            new IconButton("Rollback", { icon: "undo" }),
            new IconButton("War room", { icon: "groups" }),
          ],
          "flex-start",
        ),
        new ThemeToggle(context, themeOps),
        new Button("Page on-call")
          .addClass("primary")
          .onClick(() => {
            statusBar.show();
            statusBar.update(0.4, "Paging @oncall-platform…");
            setTimeout(() => statusBar.update(1, "On-call acknowledged"), 900);
            setTimeout(() => statusBar.hide(), 2000);
            new Toast("Page sent", "warning", { duration: 2000 });
          }),
      ),
    );
}

function buildAlertRail(onSelect) {
  const list = new StackPanel({ isVertical: true }).gap("0.5rem");
  list.add(new InputSearch("Filter alerts…", () => {}));
  list.add(new Caption("Active signals"));

  for (const alert of ALERTS) {
    const card = new Card()
      .addClass("ops-alert")
      .padding("0.65rem")
      .add(
        new StackPanel({ isVertical: true })
          .gap("0.25rem")
          .add(
            row(new TextBlock(alert.title), new Badge(alert.tone)),
            new Caption(alert.detail),
          ),
      );
    card.dom.addEventListener("click", () => onSelect(alert));
    list.add(card);
  }

  return new Container()
    .addClass("ops-pane")
    .addClass("ops-pane--side")
    .add(list);
}

function buildMetricsTab() {
  const errorChart = makeChart({
    type: "line",
    data: {
      labels: ["14:00", "14:05", "14:10", "14:15", "14:20", "14:25"],
      datasets: [
        {
          label: "5xx %",
          data: [0.4, 0.6, 1.2, 3.8, 4.2, 3.1],
          borderColor: "rgb(220, 100, 100)",
          backgroundColor: "rgba(220, 100, 100, 0.15)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Budget",
          data: [1, 1, 1, 1, 1, 1],
          borderColor: "rgb(126, 200, 74)",
          borderDash: [4, 4],
          pointRadius: 0,
        },
      ],
    },
  });

  const latency = makeChart({
    type: "bar",
    data: {
      labels: ["p50", "p90", "p95", "p99"],
      datasets: [
        {
          label: "Latency ms",
          data: [42, 110, 180, 420],
          backgroundColor: "rgba(86, 156, 214, 0.6)",
          borderColor: "rgb(86, 156, 214)",
          borderWidth: 1,
        },
      ],
    },
  });

  return new StackPanel({ isVertical: true })
    .gap("0.75rem")
    .add(
      row(new Heading(4, "api-gateway"), new Badge("SEV-2"), new Caption("INC-1842")),
      new StackPanel({ isVertical: false })
        .gap("0.75rem")
        .setStyle("flexWrap", ["wrap"])
        .add(
          new Card()
            .setStyle("flex", ["1 1 16rem"])
            .padding("0.75rem")
            .add(
              new StackPanel({ isVertical: true })
                .gap("0.5rem")
                .add(new Caption("Error budget burn"))
                .add(errorChart),
            ),
          new Card()
            .setStyle("flex", ["1 1 12rem"])
            .padding("0.75rem")
            .add(
              new StackPanel({ isVertical: true })
                .gap("0.5rem")
                .add(new Caption("Latency"))
                .add(latency),
            ),
        ),
    );
}

function buildIncidentsTab() {
  const grid = new DataGrid({
    height: "360px",
    data: INCIDENTS,
    columnNameMapper: {
      id: "Incident",
      service: "Service",
      severity: "Severity",
      age: "Age",
      commander: "Commander",
      status: "Status",
    },
  });

  return new StackPanel({ isVertical: true })
    .gap("0.75rem")
    .add(
      row(
        new TextBlock("Incident register"),
        new Button("Open INC-1842").addClass("secondary").onClick(() =>
          new Toast("Focus INC-1842", "info", { duration: 1600 }),
        ),
      ),
      afterAttach(grid, () => grid.init()),
    );
}

function buildTopologyTab() {
  const host = new Container().addClass("ops-graph-host");
  const nodes = new NodeGraph({
    embedded: true,
    nodes: [
      { id: 1, name: "cdn", status: "Healthy", level: 0, parent: 0, children: [2] },
      { id: 2, name: "api-gateway", status: "Degraded", level: 1, parent: 1, children: [3, 4] },
      { id: 3, name: "auth", status: "Healthy", level: 2, parent: 2, children: [] },
      { id: 4, name: "billing-worker", status: "Lagging", level: 2, parent: 2, children: [5] },
      { id: 5, name: "postgres", status: "Healthy", level: 3, parent: 4, children: [] },
    ],
    connections: [
      { source: 1, sourceHandle: "output", target: 2, targetHandle: "input" },
      { source: 2, sourceHandle: "output", target: 3, targetHandle: "input" },
      { source: 2, sourceHandle: "output", target: 4, targetHandle: "input" },
      { source: 4, sourceHandle: "output", target: 5, targetHandle: "input" },
    ],
    onEdit: (node) => new Toast(`Inspect ${node.name}`, "info", { duration: 1600 }),
  });
  host.add(nodes);

  return new StackPanel({ isVertical: true })
    .gap("0.5rem")
    .add(
      new Caption("Dependency graph — click a node to inspect"),
      host,
    );
}

function buildMainPane() {
  const detail = new Caption("Select an alert on the left to focus the board.");
  const tabs = new TabView();
  tabs.addTab("metrics", "Metrics", buildMetricsTab());
  tabs.addTab("incidents", "Incidents", buildIncidentsTab());
  tabs.addTab("topology", "Topology", buildTopologyTab());
  tabs.select("metrics");

  const pane = new Container().addClass("ops-pane").addClass("ops-pane--main");
  pane.add(
    new StackPanel({ isVertical: true })
      .gap("0.75rem")
      .add(detail, new Line(), tabs),
  );

  return {
    pane,
    focusAlert(alert) {
      detail.setTextContent(`Focused: ${alert.title} — ${alert.detail}`);
      tabs.select("metrics");
    },
  };
}

export function startOpsDemo(host) {
  const context = createThemeContext();
  const themeOps = {
    execute(_cmd, ctx, theme) {
      document.documentElement.dataset.theme = theme === "day" ? "light" : "dark";
      ctx.config.ui.theme.current = theme;
      ctx.signals.themeChanged.dispatch(theme);
    },
  };

  const statusBar = new StatusBar({ initialText: "Ready" });
  statusBar.hide();

  const main = buildMainPane();
  const side = buildAlertRail((alert) => main.focusAlert(alert));
  const split = new SplitContainer("horizontal", [side, main.pane]);

  const root = new Container().addClass("ops-root");
  const mainWrap = new Container().addClass("ops-main");
  mainWrap.add(split);

  const footer = new Container().addClass("ops-footer");
  footer.add(
    row(
      new Caption("Last deploy 14:12 UTC · error budget 62% remaining"),
      statusBar,
    ),
  );

  root.add(buildHeader(context, themeOps, statusBar));
  root.add(mainWrap);
  root.add(footer);
  host.appendChild(root.dom);
}
