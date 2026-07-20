import {
  StackPanel,
  Container,
  TextBlock,
  Caption,
  Button,
  Code,
  Disclaimer,
} from "drawui";
import { DEMO_BUILDERS } from "./demos.js";

/** @type {Record<string, () => import("drawui").Control>} */
let demoBuilders = { ...DEMO_BUILDERS };

const CATEGORY_ICONS = {
  text: "title",
  inputs: "edit_note",
  layout: "dashboard",
  collections: "list",
  panels: "view_agenda",
  overlays: "open_in_new",
  shell: "view_sidebar",
  peers: "extension",
  "layout-spacing": "view_quilt",
  "layout-surfaces": "crop_square",
  "layout-tabs": "tab",
  "layout-floating": "open_in_new",
  "panels-chrome": "web_asset",
  "shell-views": "view_sidebar",
  "shell-workspace": "workspaces",
  "overlays-toolwindow": "tab",
  "text-headings": "title",
  "text-body": "notes",
  "text-rich": "article",
  "inline-labels": "label",
  icons: "apps",
  actions: "touch_app",
  "form-inputs": "edit_note",
  feedback: "notifications",
  "data-forms": "dynamic_form",
  "data-lists": "list",
  "data-hierarchy": "account_tree",
  "data-properties": "table_rows",
  "data-reference": "help",
  theme: "dark_mode",
  charts: "bar_chart",
  spreadsheet: "grid_on",
  scheduling: "view_timeline",
  markdown: "article",
  nodes: "account_tree",
  menus: "pie_chart",
  "full-build": "extension",
};

/** Top-level gallery tabs — mirrors Control → Container hierarchy. */
const GALLERY_TABS = [
  { id: "text", label: "Text" },
  { id: "inputs", label: "Inputs" },
  { id: "layout", label: "Layout" },
  { id: "collections", label: "Collections" },
  { id: "panels", label: "Panels" },
  { id: "overlays", label: "Overlays" },
  { id: "shell", label: "Shell" },
];

const JUMP_NAV_THRESHOLD = 3;

function itemTitle(item) {
  if (item.title) return item.title;
  return item.id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Sibling factories on a page.
 * Legacy: top-level `variants` entries that include `api` were sibling factories.
 * True style variants use `variants` without `api` (on the item or on a sibling).
 */
function getSiblings(item) {
  if (item.siblings?.length) return item.siblings;
  if (item.variants?.length && item.variants.some((entry) => entry.api)) {
    return item.variants;
  }
  return [];
}

function getAlternatives(item) {
  return item.alternatives?.length ? item.alternatives : [];
}

function getParts(item) {
  return item.parts?.length ? item.parts : [];
}

function getStyleVariants(item) {
  if (!item.variants?.length) return [];
  if (item.variants.some((entry) => entry.api)) return [];
  return item.variants;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function apiChip(api) {
  const chip = new Code(api);
  chip.addClass("Gallery-apiChip");
  return chip;
}

function optionsRow(options) {
  const row = new StackPanel({ isVertical: false }).addClass("Gallery-optionsRow");
  const label = new Caption("Options");
  label.addClass("Gallery-optionsLabel");
  row.add(label).add(apiChip(options));
  return row;
}

function sectionLabel(text) {
  const label = new Caption(text);
  label.addClass("Gallery-sectionLabel");
  return label;
}

/**
 * Table-like row: name + summary above preview | API on the right.
 * @param {{ name?: string, summary?: string, demo?: import("drawui").Control | null, apis?: string[] }} parts
 */
function buildComponentRow({ name, summary, demo, apis }) {
  const row = new Container().addClass("Gallery-componentRow");

  const main = new Container().addClass("Gallery-componentMain");

  const meta = new Container().addClass("Gallery-componentMeta");
  if (name) {
    const title = new TextBlock(name);
    title.addClass("Gallery-siblingTitle");
    meta.add(title);
  }
  if (summary) {
    const summaryEl = new Caption(summary);
    summaryEl.addClass("Gallery-summary");
    meta.add(summaryEl);
  }
  main.add(meta);

  if (demo) {
    const preview = new Container().addClass("Gallery-componentPreview");
    preview.add(demo);
    main.add(preview);
  }

  row.add(main);

  const apiCol = new Container().addClass("Gallery-componentApi");
  (apis ?? []).forEach((api) => apiCol.add(apiChip(api)));
  row.add(apiCol);

  return row;
}

function buildStyleVariants(variants) {
  const wrap = new StackPanel({ isVertical: true }).addClass("Gallery-styleVariants");
  const label = new Caption("Variants");
  label.addClass("Gallery-styleVariantsLabel");
  wrap.add(label);

  const row = new StackPanel({ isVertical: false }).addClass("Gallery-styleVariantsRow");
  variants.forEach((variant) => {
    const cell = new StackPanel({ isVertical: true }).addClass("Gallery-styleVariant");
    const name = new Caption(variant.name);
    name.addClass("Gallery-styleVariantName");
    cell.add(name);
    if (variant.demo && demoBuilders[variant.demo]) {
      cell.add(demoBuilders[variant.demo]());
    }
    row.add(cell);
  });
  wrap.add(row);
  return wrap;
}

function buildSiblingSection(sibling, { sectionId } = {}) {
  const section = new StackPanel({ isVertical: true }).addClass("Gallery-sibling");
  if (sectionId) {
    section.dom.id = sectionId;
    section.dom.dataset.siblingId = sectionId;
  }

  const demo =
    sibling.demo && demoBuilders[sibling.demo]
      ? demoBuilders[sibling.demo]()
      : null;

  section.add(
    buildComponentRow({
      name: sibling.name,
      summary: sibling.summary,
      demo,
      apis: sibling.api ? [sibling.api] : sibling.apis,
    }),
  );

  if (sibling.variants?.length) {
    section.add(buildStyleVariants(sibling.variants));
  }

  if (sibling.options) section.add(optionsRow(sibling.options));
  if (sibling.note) section.add(new Disclaimer(sibling.note));

  return section;
}

function buildJumpNav(siblings, sectionIds) {
  const nav = new StackPanel({ isVertical: false }).addClass("Gallery-jumpNav");
  const chips = [];

  siblings.forEach((sibling, index) => {
    const chip = new Button(sibling.name);
    chip.addClass("Gallery-jumpChip");
    if (index === 0) chip.addClass("is-active");
    chip.onClick(() => {
      const target = document.getElementById(sectionIds[index]);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      chips.forEach((c) => c.removeClass("is-active"));
      chip.addClass("is-active");
    });
    chips.push(chip);
    nav.add(chip);
  });

  return nav;
}

function buildStackPage(item, siblings, { labeled = false, label = "Parts" } = {}) {
  const page = new StackPanel({ isVertical: true }).addClass("Gallery-page");
  if (labeled) {
    page.add(sectionLabel(label));
  }

  const sectionIds = siblings.map((sibling, index) =>
    `sibling-${item.id}-${slugify(sibling.name) || index}`,
  );

  if (siblings.length >= JUMP_NAV_THRESHOLD) {
    page.add(buildJumpNav(siblings, sectionIds));
  }

  siblings.forEach((sibling, index) => {
    page.add(buildSiblingSection(sibling, { sectionId: sectionIds[index] }));
  });

  return page;
}

function buildComparePage(item, siblings, { labeled = false, label = "Alternatives" } = {}) {
  const page = new StackPanel({ isVertical: true }).addClass("Gallery-page");
  if (labeled) {
    page.add(sectionLabel(label));
  }

  const strip = new Container().addClass("Gallery-compareStrip");
  const detailHost = new StackPanel({ isVertical: true }).addClass("Gallery-compareDetail");
  const cards = [];

  function renderDetail(index) {
    detailHost.clear();
    detailHost.add(buildSiblingSection(siblings[index]));
    cards.forEach((card, i) => {
      if (i === index) card.addClass("is-selected");
      else card.removeClass("is-selected");
    });
  }

  siblings.forEach((sibling, index) => {
    const card = new Container().addClass("Gallery-compareCard");
    card.dom.setAttribute("role", "button");
    card.dom.tabIndex = 0;

    const title = new TextBlock(sibling.name);
    title.addClass("Gallery-compareCardTitle");
    card.add(title);

    const preview = new Container().addClass("Gallery-compareCardPreview");
    if (sibling.demo && demoBuilders[sibling.demo]) {
      preview.add(demoBuilders[sibling.demo]());
    }
    card.add(preview);

    const select = () => renderDetail(index);
    card.onClick(select);
    card.dom.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    });
    cards.push(card);
    strip.add(card);
  });

  page.add(strip).add(detailHost);
  renderDetail(0);
  return page;
}

function buildOverviewBlock(item) {
  const overview = new StackPanel({ isVertical: true }).addClass("Gallery-overview");
  const label = new Caption("Overview");
  label.addClass("Gallery-overviewLabel");
  overview.add(label);

  if (item.demo && demoBuilders[item.demo]) {
    overview.add(demoBuilders[item.demo]());
  }

  if (item.summary && (item.alternatives?.length || item.parts?.length)) {
    const summaryEl = new Caption(item.summary);
    summaryEl.addClass("Gallery-summary");
    overview.add(summaryEl);
  }

  if (item.buildingBlocks) {
    const note = new TextBlock(item.buildingBlocks);
    note.addClass("Gallery-buildingBlocks");
    overview.add(note);
  }

  if (item.options) overview.add(optionsRow(item.options));
  if (item.note) overview.add(new Disclaimer(item.note));

  return overview;
}

function buildSingleItemPage(item) {
  const page = new StackPanel({ isVertical: true }).addClass("Gallery-page");

  const demo =
    item.demo && demoBuilders[item.demo] ? demoBuilders[item.demo]() : null;

  page.add(
    buildComponentRow({
      name: itemTitle(item),
      summary: item.summary,
      demo,
      apis: item.apis,
    }),
  );

  const styleVariants = getStyleVariants(item);
  if (styleVariants.length) {
    page.add(buildStyleVariants(styleVariants));
  }

  if (item.options) page.add(optionsRow(item.options));
  if (item.note) page.add(new Disclaimer(item.note));
  if (item.buildingBlocks) {
    const note = new TextBlock(item.buildingBlocks);
    note.addClass("Gallery-buildingBlocks");
    page.add(note);
  }

  return page;
}

function wrapWithOverview(item, body) {
  const needsOverview =
    item.overviewDemo ||
    item.demo ||
    item.buildingBlocks ||
    item.options ||
    item.note;

  if (!needsOverview && !item.overviewDemo) {
    // When using alternatives/parts, still show overview if composed demo exists
    if (!(item.alternatives?.length || item.parts?.length) || !item.demo) {
      return body;
    }
  }

  const page = new StackPanel({ isVertical: true }).addClass("Gallery-page");

  if (item.overviewDemo && demoBuilders[item.overviewDemo]) {
    page.add(
      buildOverviewBlock({
        demo: item.overviewDemo,
        buildingBlocks: item.buildingBlocks,
        summary: item.summary,
        options: item.options,
        note: item.note,
      }),
    );
  } else if (item.alternatives?.length || item.parts?.length) {
    if (item.demo || item.buildingBlocks || item.options || item.note) {
      page.add(buildOverviewBlock(item));
    }
  } else if (item.buildingBlocks) {
    const note = new TextBlock(item.buildingBlocks);
    note.addClass("Gallery-buildingBlocks");
    page.add(note);
  }

  body.removeClass("Gallery-page");
  page.add(body);
  return page;
}

function buildItemPage(item) {
  const alternatives = getAlternatives(item);
  const parts = getParts(item);
  const hasStructured = alternatives.length > 0 || parts.length > 0;

  if (hasStructured) {
    const page = new StackPanel({ isVertical: true }).addClass("Gallery-page");

    if (item.demo || item.buildingBlocks || item.options || item.note || item.overviewDemo) {
      if (item.overviewDemo && demoBuilders[item.overviewDemo]) {
        page.add(
          buildOverviewBlock({
            demo: item.overviewDemo,
            buildingBlocks: item.buildingBlocks,
            summary: item.summary,
            options: item.options,
            note: item.note,
          }),
        );
      } else {
        page.add(buildOverviewBlock(item));
      }
    } else if (item.summary || item.apis?.length) {
      page.add(
        buildComponentRow({
          name: itemTitle(item),
          summary: item.summary,
          demo: null,
          apis: item.apis,
        }),
      );
    }

    if (alternatives.length) {
      const useCompare = item.layout === "compare" || alternatives.length >= 2;
      const alts = useCompare
        ? buildComparePage(item, alternatives, { labeled: true, label: "Alternatives" })
        : buildStackPage(item, alternatives, { labeled: true, label: "Alternatives" });
      alts.removeClass("Gallery-page");
      page.add(alts);
    }

    if (parts.length) {
      const partsBody = buildStackPage(item, parts, { labeled: true, label: "Parts" });
      partsBody.removeClass("Gallery-page");
      page.add(partsBody);
    }

    return page;
  }

  const siblings = getSiblings(item);

  if (!siblings.length) {
    return buildSingleItemPage(item);
  }

  const body =
    item.layout === "compare"
      ? buildComparePage(item, siblings)
      : buildStackPage(item, siblings);

  return wrapWithOverview(item, body);
}

function buildFullBuildPage(entries) {
  const page = new StackPanel({ isVertical: true }).addClass("Gallery-page").gap("0.5rem");

  page.add(
    new Disclaimer(
      "These APIs ship only in the full DrawUI entry. Open full.html to try live demos with peer packages under the Peers tab.",
    ),
  );

  (entries ?? []).forEach((entry) => {
    page.add(
      new StackPanel({ isVertical: false })
        .gap("0.5rem")
        .setStyle("alignItems", ["center"])
        .setStyle("flexWrap", ["wrap"])
        .add(apiChip(entry.api))
        .add(new Caption(`→ ${entry.peer}`)),
    );
  });

  return page;
}

function categoryToLeaf(category, { collapsed }) {
  return {
    id: category.id,
    label: category.title,
    icon: CATEGORY_ICONS[category.id] ?? "widgets",
    collapsed,
    items: category.items.map((item) => ({
      id: item.id,
      label: itemTitle(item),
      subtitle: item.summary ?? "",
      render: () => buildItemPage(item),
    })),
  };
}

function buildGroups(catalog, { build }) {
  /** @type {Record<string, ReturnType<typeof categoryToLeaf>[]>} */
  const byTab = Object.fromEntries(GALLERY_TABS.map((tab) => [tab.id, []]));

  catalog.categories.forEach((category) => {
    const tabId = byTab[category.group] ? category.group : "panels";
    byTab[tabId].push(categoryToLeaf(category, { collapsed: true }));
  });

  for (const tab of GALLERY_TABS) {
    if (byTab[tab.id].length) byTab[tab.id][0].collapsed = false;
  }

  const peerCategories = catalog.peerCategories?.length
    ? catalog.peerCategories
    : catalog.peerCategory?.items?.length
      ? [catalog.peerCategory]
      : [];

  /** @type {ReturnType<typeof categoryToLeaf>[]} */
  const peerLeaves = [];

  if (build === "full" && peerCategories.length) {
    peerCategories.forEach((peer, index) => {
      if (!peer.items?.length) return;
      peerLeaves.push(categoryToLeaf(peer, { collapsed: index !== 0 }));
    });
  } else {
    peerLeaves.push({
      id: "full-build",
      label: "Full build only",
      icon: CATEGORY_ICONS["full-build"],
      collapsed: false,
      items: [
        {
          id: "full-build-overview",
          label: "Vendor dependencies",
          subtitle: "Requires drawui/full and external packages.",
          render: () => buildFullBuildPage(catalog.fullBuildOnly),
        },
      ],
    });
  }

  const groups = GALLERY_TABS.filter((tab) => byTab[tab.id].length).map((tab, index) => ({
    id: tab.id,
    label: tab.label,
    icon: CATEGORY_ICONS[tab.id] ?? "widgets",
    collapsed: index !== 0,
    groups: byTab[tab.id],
  }));

  if (peerLeaves.length) {
    groups.push({
      id: "peers",
      label: "Peers",
      icon: CATEGORY_ICONS.peers,
      collapsed: true,
      groups: peerLeaves,
    });
  }

  return groups;
}

/**
 * @param {HTMLElement} mountEl
 * @param {{ build?: "min" | "full" }} [options]
 */
export async function mountGallery(mountEl, { build = "min" } = {}) {
  demoBuilders = { ...DEMO_BUILDERS };

  if (build === "full") {
    const { FULL_DEMO_BUILDERS } = await import("./demos.full.js");
    demoBuilders = { ...demoBuilders, ...FULL_DEMO_BUILDERS };
  }

  const response = await fetch("./catalog.json");
  if (!response.ok) {
    throw new Error(`Failed to load catalog.json (${response.status}). Run npm run build:catalog first.`);
  }

  const catalog = await response.json();

  const spa = new AppShell({
    sidebarTitle: build === "full" ? "Full reference" : "Core reference",
    groups: buildGroups(catalog, { build }),
  });

  const theme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  const themeToggle = new Button(theme === "light" ? "Switch to dark" : "Switch to light")
    .addClass("secondary")
    .addClass("Gallery-themeToggle")
    .onClick(() => {
      const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      themeToggle.setValue(next === "light" ? "Switch to dark" : "Switch to light");
    });

  spa.setSidebarFooter(themeToggle);

  mountEl.appendChild(spa.dom);
  spa.start();
}
