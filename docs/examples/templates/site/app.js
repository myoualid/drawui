import {
  AppShell,
  StackPanel,
  Container,
  Card,
  Heading,
  TextBlock,
  Caption,
  Badge,
  Button,
  ThemeToggle,
  Toast,
  Chart,
  DataGrid,
  GanttChart,
  Markdown,
  TabView,
  ProgressBar,
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

function page(...children) {
  return new StackPanel({ isVertical: true })
    .gap("1rem")
    .addClass("site-page")
    .add(...children);
}

function row(...children) {
  return new StackPanel({ isVertical: false })
    .gap("0.5rem")
    .setStyle("alignItems", ["center"])
    .setStyle("flexWrap", ["wrap"])
    .add(...children);
}

function kpi(label, value, hint) {
  return new Card()
    .addClass("site-kpi")
    .padding("0.85rem")
    .add(
      new StackPanel({ isVertical: true })
        .gap("0.35rem")
        .add(new Caption(label))
        .add(new Heading(3, value))
        .add(new TextBlock(hint)),
    );
}

function makeChart(config, height = "240px") {
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

/* ── Sample data ──────────────────────────────────────────────── */

const PLANT_BOOKINGS = [
  { asset: "Tower crane TC-01", site: "Block A", crew: "Lift team", from: "2026-07-20", to: "2026-07-24", status: "On hire" },
  { asset: "MEWP 19m", site: "Facade west", crew: "Cladding", from: "2026-07-21", to: "2026-07-22", status: "Confirmed" },
  { asset: "Telehandler TH-4", site: "Yard", crew: "Logistics", from: "2026-07-20", to: "2026-07-27", status: "On hire" },
  { asset: "Concrete pump", site: "Core pour L3", crew: "Concrete", from: "2026-07-23", to: "2026-07-23", status: "Requested" },
  { asset: "Welfare cabin W2", site: "Compound", crew: "Site mgmt", from: "2026-07-01", to: "2026-09-30", status: "On hire" },
];

const TIMESHEETS = [
  { worker: "A. Khan", trade: "Steel fixer", costCode: "STR-210", mon: 10, tue: 10, wed: 8, thu: 10, fri: 6, total: 44 },
  { worker: "M. Okafor", trade: "Carpenter", costCode: "ARC-140", mon: 9, tue: 9, wed: 9, thu: 9, fri: 8, total: 44 },
  { worker: "J. Ellis", trade: "Banksman", costCode: "LOG-050", mon: 10, tue: 10, wed: 10, thu: 8, fri: 8, total: 46 },
  { worker: "S. Patel", trade: "Electrician", costCode: "MEP-320", mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, total: 40 },
  { worker: "R. Costa", trade: "Labourer", costCode: "GEN-010", mon: 10, tue: 8, wed: 10, thu: 10, fri: 4, total: 42 },
];

const DELIVERIES = [
  { window: "06:30–07:00", supplier: "ReadyMix Ltd", load: "C40 concrete · 6m³", bay: "Bay 2", status: "Arrived" },
  { window: "08:00–08:30", supplier: "SteelFab", load: "Rebar cages · Level 3", bay: "Bay 1", status: "En route" },
  { window: "10:30–11:00", supplier: "BuildStore", load: "Formwork panels", bay: "Yard", status: "Booked" },
  { window: "13:00–13:30", supplier: "PlantHire Co", load: "MEWP swap", bay: "Gate A", status: "Booked" },
];

const PROGRAMME_TASKS = [
  {
    pID: 1, pName: "Groundworks", pStart: "2026-07-01", pEnd: "2026-07-12",
    pPlanStart: "2026-07-01", pPlanEnd: "2026-07-12", pClass: "gtaskblue",
    pLink: "", pMile: 0, pRes: "Civils", pComp: 85, pGroup: 0, pParent: 0, pOpen: 1,
    pDepend: "", pCaption: "", pCost: 0, pNotes: "",
  },
  {
    pID: 2, pName: "Structure L1–L3", pStart: "2026-07-10", pEnd: "2026-07-28",
    pPlanStart: "2026-07-10", pPlanEnd: "2026-07-28", pClass: "gtaskblue",
    pLink: "", pMile: 0, pRes: "Frame", pComp: 35, pGroup: 0, pParent: 0, pOpen: 1,
    pDepend: "1", pCaption: "", pCost: 0, pNotes: "",
  },
  {
    pID: 3, pName: "MEP first fix", pStart: "2026-07-22", pEnd: "2026-08-08",
    pPlanStart: "2026-07-22", pPlanEnd: "2026-08-08", pClass: "gtaskblue",
    pLink: "", pMile: 0, pRes: "MEP", pComp: 5, pGroup: 0, pParent: 0, pOpen: 1,
    pDepend: "2", pCaption: "", pCost: 0, pNotes: "",
  },
  {
    pID: 4, pName: "Tower crane demob", pStart: "2026-08-12", pEnd: "2026-08-12",
    pPlanStart: "2026-08-12", pPlanEnd: "2026-08-12", pClass: "gmilestone",
    pLink: "", pMile: 1, pRes: "Plant", pComp: 0, pGroup: 0, pParent: 0, pOpen: 1,
    pDepend: "3", pCaption: "", pCost: 0, pNotes: "",
  },
];

/* ── Pages ────────────────────────────────────────────────────── */

function pageOverview() {
  const utilization = makeChart({
    type: "bar",
    data: {
      labels: ["Crane", "MEWP", "Telehandler", "Pump", "Welfare"],
      datasets: [
        {
          label: "Utilisation %",
          data: [92, 74, 81, 40, 100],
          backgroundColor: "rgba(126, 200, 74, 0.55)",
          borderColor: "rgb(126, 200, 74)",
          borderWidth: 1,
        },
      ],
    },
  });

  const labour = makeChart({
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      datasets: [
        {
          label: "Hours booked",
          data: [210, 225, 198, 240, 186],
          borderColor: "rgb(86, 156, 214)",
          backgroundColor: "rgba(86, 156, 214, 0.2)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Hours worked",
          data: [198, 220, 190, 228, 172],
          borderColor: "rgb(206, 145, 120)",
          backgroundColor: "rgba(206, 145, 120, 0.15)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
  });

  const deliveryGrid = new DataGrid({
    height: "220px",
    data: DELIVERIES,
    columnNameMapper: {
      window: "Slot",
      supplier: "Supplier",
      load: "Load",
      bay: "Bay",
      status: "Status",
    },
  });

  return page(
    row(
      new Badge("Live site"),
      new Caption("Riverside Tower · Gate A open · Crane under permit"),
      new Button("Notify logistics")
        .addClass("secondary")
        .onClick(() => new Toast("Logistics channel pinged", "success", { duration: 2000 })),
    ),
    new StackPanel({ isVertical: false })
      .gap("0.75rem")
      .setStyle("flexWrap", ["wrap"])
      .add(
        kpi("Plant on hire", "5", "1 request pending"),
        kpi("Today deliveries", "4", "1 arrived"),
        kpi("Labour hours", "216", "vs 230 booked"),
        kpi("Open RFIs", "3", "2 due this week"),
      ),
    new StackPanel({ isVertical: false })
      .gap("1rem")
      .setStyle("flexWrap", ["wrap"])
      .setStyle("alignItems", ["stretch"])
      .add(
        new Card()
          .addClass("site-chart-card")
          .setStyle("flex", ["1 1 16rem"])
          .padding("0.75rem")
          .add(
            new StackPanel({ isVertical: true })
              .gap("0.5rem")
              .add(new Heading(4, "Plant utilisation"))
              .add(utilization),
          ),
        new Card()
          .addClass("site-chart-card")
          .setStyle("flex", ["1 1 16rem"])
          .padding("0.75rem")
          .add(
            new StackPanel({ isVertical: true })
              .gap("0.5rem")
              .add(new Heading(4, "Labour this week"))
              .add(labour),
          ),
      ),
    new Card()
      .padding("0.75rem")
      .add(
        new StackPanel({ isVertical: true })
          .gap("0.5rem")
          .add(new Heading(4, "Delivery window — today"))
          .add(afterAttach(deliveryGrid, () => deliveryGrid.init())),
      ),
  );
}

function pageBookings() {
  const grid = new DataGrid({
    height: "420px",
    data: PLANT_BOOKINGS,
    columnNameMapper: {
      asset: "Asset",
      site: "Workface",
      crew: "Crew",
      from: "From",
      to: "To",
      status: "Status",
    },
  });

  return page(
    row(
      new TextBlock("Resource & plant bookings"),
      new Badge("Week 30"),
      new Button("New booking").addClass("primary"),
    ),
    new Caption("Hire desk view — confirm slots against crane permits and bay capacity."),
    afterAttach(grid, () => grid.init()),
    row(
      new Caption("Compound occupancy"),
      new ProgressBar(0.78),
    ),
  );
}

function pageTimesheets() {
  const grid = new DataGrid({
    height: "380px",
    data: TIMESHEETS,
    columnNameMapper: {
      worker: "Operative",
      trade: "Trade",
      costCode: "Cost code",
      mon: "Mon",
      tue: "Tue",
      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      total: "Total",
    },
  });

  const mix = makeChart(
    {
      type: "doughnut",
      data: {
        labels: ["Steel", "Carpentry", "Logistics", "MEP", "General"],
        datasets: [
          {
            data: [44, 44, 46, 40, 42],
            backgroundColor: [
              "rgba(86, 156, 214, 0.7)",
              "rgba(78, 201, 176, 0.7)",
              "rgba(220, 220, 170, 0.7)",
              "rgba(206, 145, 120, 0.7)",
              "rgba(126, 200, 74, 0.7)",
            ],
          },
        ],
      },
      options: { plugins: { legend: { position: "right" } } },
    },
    "220px",
  );

  const tabs = new TabView();
  tabs.addTab(
    "grid",
    "Timesheets",
    new StackPanel({ isVertical: true })
      .gap("0.75rem")
      .add(afterAttach(grid, () => grid.init()))
      .add(
        row(
          new Button("Submit week").addClass("primary").onClick(() =>
            new Toast("Timesheets submitted for approval", "success", { duration: 2200 }),
          ),
          new Button("Export CSV").addClass("secondary"),
        ),
      ),
  );
  tabs.addTab(
    "mix",
    "Trade mix",
    new Card().padding("0.75rem").add(
      new StackPanel({ isVertical: true })
        .gap("0.5rem")
        .add(new Caption("Hours by trade (this week)"))
        .add(mix),
    ),
  );
  tabs.select("grid");

  return page(
    row(new TextBlock("Weekly timesheets"), new Caption("Cost codes · overtime flagged > 45h")),
    tabs,
  );
}

function pageProgramme() {
  const host = new Container().addClass("site-gantt-host");
  const gantt = new GanttChart({});
  gantt.render(PROGRAMME_TASKS, host);

  return page(
    row(
      new TextBlock("Short-term look-ahead"),
      new Badge("4-week"),
      new Caption("Plant demob milestone linked to MEP first fix"),
    ),
    new Card().padding("0.5rem").add(host),
  );
}

function pageBriefing() {
  return page(
    new Markdown(
      [
        "# Site briefing — Mon 20 Jul",
        "",
        "## Logistics",
        "- **Gate A** open 06:00–18:00; reverse parking only for ReadyMix.",
        "- Crane **TC-01** under permit until 16:00 — no overlapping MEWP on west facade.",
        "- Compound at **78%** capacity; return empty pallets today.",
        "",
        "## Labour",
        "| Trade | Headcount | Notes |",
        "| --- | --- | --- |",
        "| Steel | 6 | L3 cages |",
        "| Carpentry | 4 | Formwork strip |",
        "| MEP | 3 | First fix start Wed |",
        "",
        "## Actions",
        "1. Confirm concrete window with ReadyMix by 15:00.",
        "2. Banksman brief before 06:30 pour.",
        "3. Close RFI-118 (rebar clash) before Thursday pour.",
        "",
        "```",
        "Permit: LIFT-2026-074 · Crane TC-01",
        "```",
      ].join("\n"),
      { isMarkdown: true },
    ),
  );
}

/* ── Boot ─────────────────────────────────────────────────────── */

function createThemeToggleStub() {
  const listeners = new Set();
  const signals = {
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
  };
  return {
    config: { ui: { theme: { current: "night", default: "night" } } },
    signals,
  };
}

export function startSiteDemo(host) {
  const context = createThemeToggleStub();
  const themeOps = {
    execute(_cmd, ctx, theme) {
      document.documentElement.dataset.theme = theme === "day" ? "light" : "dark";
      ctx.config.ui.theme.current = theme;
      ctx.signals.themeChanged.dispatch(theme);
    },
  };

  const shell = new AppShell({
    sidebarTitle: "Site logistics",
    layout: {
      sidebarWidth: "240px",
      sidebarMinWidth: "200px",
      sidebarMaxWidth: "300px",
    },
    groups: [
      {
        id: "ops",
        label: "Site ops",
        icon: "construction",
        items: [
          { id: "overview", label: "Overview", subtitle: "KPIs, utilisation, today’s deliveries", render: pageOverview },
          { id: "bookings", label: "Plant bookings", subtitle: "Hire desk & workface assignments", render: pageBookings },
          { id: "timesheets", label: "Timesheets", subtitle: "Weekly labour by cost code", render: pageTimesheets },
        ],
      },
      {
        id: "plan",
        label: "Planning",
        icon: "event",
        collapsed: true,
        items: [
          { id: "programme", label: "Programme", subtitle: "Look-ahead Gantt", render: pageProgramme },
          { id: "briefing", label: "Daily briefing", subtitle: "Markdown site note", render: pageBriefing },
        ],
      },
    ],
  });

  // Theme control in sidebar footer area via main header actions isn't built-in —
  // mount a small floating control on the host.
  const themeHost = new Container().setStyles({
    position: "fixed",
    top: "0.75rem",
    right: "1rem",
    zIndex: "20",
  });
  themeHost.add(new ThemeToggle(context, themeOps));

  host.appendChild(shell.dom);
  host.appendChild(themeHost.dom);
  shell.start();
}
