import { Container, Icon, Text } from "../primitives/ui.js";
import { Operator } from "../components/controls/Operator.js";
import { createLayoutResizerElement, bindLayoutResizerDrag } from "./resizers.js";

const REGIONS = ["left", "right", "bottom"];

/**
 * Compact shell for tablets and phones, owned by a {@link WorkspaceLayout}.
 *
 * Left, right and bottom panels share one workspace and switch with a tab
 * strip. Landscape puts the viewport on the left and the workspace on the
 * right; portrait puts the workspace on top and the viewport below. The
 * ribbon menu becomes a bottom bar and `#RibbonBar` a tray that opens above
 * it on demand. The footer has no row of its own: its content floats above
 * the bar.
 *
 * Panels stay in their region stacks, so switching back to the desktop grid
 * restores the docks as they were.
 *
 * @category Shell
 */
class CompactWorkspace {
  /**
   * @param {import('./WorkspaceLayout.js').WorkspaceLayout} layout
   */
  constructor(layout) {
    this.layout = layout;

    this.enabled = false;
    this.portrait = false;
    this.open = true;
    this.ribbonOpen = false;

    /** @type {string|null} */
    this.activeTabId = null;
    this._userPicked = false;

    this.ratio = {
      landscape: layout.config.compactLandscapeRatio,
      portrait: layout.config.compactPortraitRatio,
    };

    /** @type {Container|null} */
    this.tabs = null;
    /** @type {{ landscape: HTMLElement|null, portrait: HTMLElement|null }} */
    this.resizers = { landscape: null, portrait: null };
    /** @type {{ panels: Operator|null, ribbon: Operator|null }} */
    this.toggles = { panels: null, ribbon: null };

    /** @type {Array<() => void>} */
    this._cleanups = [];
  }

  init() {
    const { layout } = this;
    const container = layout.container;

    this.tabs = new Container().setId("WorkspaceTabs").addClass("WorkspaceTabs").addClass("TabView-tabs");
    this.tabs.dom.setAttribute("role", "tablist");
    container.appendChild(this.tabs.dom);

    this.resizers.landscape = this._createResizer("right", false);
    this.resizers.portrait = this._createResizer("bottom", true);

    this._createToggles();
    this._bindRibbonTray();

    this._cleanups.push(
      layout.on("tab:added", ({ id }) => this._onTabAdded(id)),
      layout.on("tab:removed", ({ id }) => this._onTabRemoved(id)),
      layout.on("tab:selected", ({ id }) => {
        this._userPicked = true;
        this.activeTabId = id;
        this.refresh();
      }),
    );

    this.refresh();
    return this;
  }

  /**
   * Re-evaluate compact mode and orientation from the container size.
   * @returns {boolean} Whether the mode or the orientation changed.
   */
  sync() {
    const container = this.layout.container;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return false;

    const enabled = this._shouldCompact(width, height);
    const portrait = height > width;
    const changed = enabled !== this.enabled || portrait !== this.portrait;

    this.enabled = enabled;
    this.portrait = portrait;

    container.classList.toggle("is-compact", enabled);
    container.classList.toggle("is-portrait", enabled && portrait);
    container.classList.toggle("is-landscape", enabled && !portrait);

    if (!enabled) {
      this.setRibbonOpen(false);
      this._leave();
    }

    if (this.toggles.panels) {
      this.toggles.panels.setIcon(portrait ? "horizontal_split" : "vertical_split");
    }

    return changed;
  }

  /** @private */
  _shouldCompact(width, height) {
    const { compact, compactBreakpoint } = this.layout.config;
    if (compact === true) return true;
    if (compact === false) return false;
    if (height > width || width <= compactBreakpoint) return true;

    const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    return coarse && Math.min(width, height) <= compactBreakpoint;
  }

  /** Grid tracks, region visibility, and the active panel for compact mode. */
  apply() {
    if (!this.enabled) return;

    const { layout } = this;
    const { config } = layout;
    const container = layout.container;
    const activeRegion = this.regionOf(this.activeTabId);
    const open = this.open && Boolean(activeRegion);
    const resizer = open ? config.compactResizerSize : 0;
    const barHeight = this.open ? config.compactBarHeight : 0;
    const bar = `${barHeight}px`;

    container.classList.toggle("is-workspace-hidden", !this.open);

    if (this.portrait) {
      const room = container.clientHeight - barHeight;
      const size = open ? this._clampSize(room * this.ratio.portrait, room) : 0;
      container.style.gridTemplateColumns = "minmax(0, 1fr)";
      container.style.gridTemplateRows = `auto ${size}px ${resizer}px minmax(0, 1fr) ${bar}`;
      container.style.gridTemplateAreas = '"tabs" "workspace" "resizer" "viewport" "bar"';
    } else {
      const room = container.clientWidth;
      const size = open ? this._clampSize(room * this.ratio.landscape, room) : 0;
      container.style.gridTemplateColumns = `minmax(0, 1fr) ${resizer}px ${size}px`;
      container.style.gridTemplateRows = `auto minmax(0, 1fr) ${bar}`;
      container.style.gridTemplateAreas =
        '"viewport resizer tabs" "viewport resizer workspace" "bar bar bar"';
    }

    this.tabs.dom.style.display = open ? "" : "none";
    this.resizers.portrait.style.display = open && this.portrait ? "block" : "none";
    this.resizers.landscape.style.display = open && !this.portrait ? "block" : "none";

    for (const region of REGIONS) {
      const host = layout.workspaces[region];
      if (host) host.style.display = open && region === activeRegion ? "" : "none";
    }

    for (const desktopResizer of Object.values(layout.resizers)) {
      if (desktopResizer) desktopResizer.style.display = "none";
    }

    this.toggles.panels?.dom.classList.toggle("Active", open);
  }

  /** @private */
  _leave() {
    const container = this.layout.container;
    container.style.gridTemplateAreas = "";
    container.classList.remove("is-workspace-hidden");
    if (this.tabs) this.tabs.dom.style.display = "none";
    for (const resizer of Object.values(this.resizers)) {
      if (resizer) resizer.style.display = "none";
    }
  }

  /** @private */
  _clampSize(size, room) {
    const min = Math.min(this.layout.config.minPanelSize, room * 0.25);
    return Math.round(Math.max(min, Math.min(size, room * 0.75)));
  }

  /** @returns {{ region: string, entry: import('./internal/WorkspaceStack.js').WorkspacePanelEntry }[]} */
  entries() {
    const items = [];
    for (const region of REGIONS) {
      for (const entry of this.layout.workspaceStacks[region]?.panelEntries ?? []) {
        items.push({ region, entry });
      }
    }
    return items;
  }

  /**
   * @param {string|null} tabId
   * @returns {string|null}
   */
  regionOf(tabId) {
    if (!tabId) return null;
    return this.entries().find((item) => item.entry.tabId === tabId)?.region ?? null;
  }

  /** Rebuild the tab strip and mark the active panel. */
  refresh() {
    if (!this.tabs) return;

    const items = this.entries();
    if (!items.some((item) => item.entry.tabId === this.activeTabId)) {
      this.activeTabId = this._fallbackTabId(items);
    }

    this.tabs.dom.replaceChildren();
    for (const { region, entry } of items) {
      const active = entry.tabId === this.activeTabId;
      entry.panelElement.classList.toggle("is-compact-active", active);

      const tab = new Container().addClass("Tab");
      tab.dom.classList.toggle("selected", active);
      tab.dom.setAttribute("role", "tab");
      tab.dom.setAttribute("aria-selected", String(active));
      const icon = entry.control?.icon;
      if (icon) tab.add(new Icon(icon));
      tab.add(new Text(entry.label).addClass("Title"));
      tab.dom.addEventListener("click", () => {
        this.layout.selectTab(region, entry.tabId, { open: true });
      });
      this.tabs.dom.appendChild(tab.dom);
    }

    this.apply();
  }

  /** @private */
  _fallbackTabId(items = this.entries()) {
    const preferred = this.layout.config.compactTab;
    if (preferred && items.some((item) => item.entry.tabId === preferred)) return preferred;
    return items[0]?.entry.tabId ?? null;
  }

  /** @private */
  _onTabAdded(id) {
    const preferred = this.layout.config.compactTab;
    if (!this.activeTabId || (!this._userPicked && id === preferred)) {
      this.activeTabId = id;
    }
    this.refresh();
  }

  /** @private */
  _onTabRemoved(id) {
    if (this.activeTabId === id) this.activeTabId = this._fallbackTabId();
    this.refresh();
  }

  /** @param {boolean} open */
  setOpen(open) {
    const next = Boolean(open);
    if (next === this.open) return;
    this.open = next;
    if (!next) this.setRibbonOpen(false);
    this.apply();
    this.layout._flushLayoutResize();
    this.layout._emit("workspace", { position: "compact", open: next });
  }

  toggle() {
    this.setOpen(!this.open);
  }

  /** @param {boolean} open */
  setRibbonOpen(open) {
    const next = Boolean(open) && this.enabled;
    if (next === this.ribbonOpen) return;
    this.ribbonOpen = next;
    this.layout.container?.classList.toggle("is-ribbon-open", next);
    this.toggles.ribbon?.dom.classList.toggle("Active", next);
    this.layout._emit("ribbon", { open: next });
  }

  /** @private */
  _createResizer(kind, portrait) {
    const element = createLayoutResizerElement(kind, this.layout.config.compactResizerSize);
    element.classList.add("Resizer-compact");
    element.style.display = "none";
    const key = portrait ? "portrait" : "landscape";

    const cleanup = bindLayoutResizerDrag(element, {
      onDragStart: (event) => {
        const { config, container } = this.layout;
        const room = portrait
          ? container.clientHeight - config.compactBarHeight
          : container.clientWidth;
        if (room <= 0) return null;
        return {
          startX: event.clientX,
          startY: event.clientY,
          startRatio: this.ratio[key],
          room,
        };
      },
      onDragMove: (event, drag) => {
        const delta = portrait ? event.clientY - drag.startY : drag.startX - event.clientX;
        this.ratio[key] = Math.max(0.2, Math.min(0.8, drag.startRatio + delta / drag.room));
        this.apply();
        window.dispatchEvent(new Event("resize"));
      },
      onDoubleClick: () => this.toggle(),
    });

    this._cleanups.push(cleanup, () => element.remove());
    this.layout.container.appendChild(element);
    return element;
  }

  /** @private */
  _createToggles() {
    const bar = this.layout.toggleBar;
    if (!bar) return;

    const make = (icon, tooltip, className, onClick) => {
      const button = new Operator(icon).setTooltip(tooltip).addClass("LayoutToggle-compact").addClass(className);
      button.onClick((event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      });
      bar.appendChild(button.dom);
      return button;
    };

    if (this.layout.config.compactRibbonToggle) {
      this.toggles.ribbon = make("apps", "Tools", "LayoutToggle-ribbon", () => {
        this.setRibbonOpen(!this.ribbonOpen);
      });
    }
    this.toggles.panels = make("vertical_split", "Toggle panels", "LayoutToggle-panels", () => this.toggle());
  }

  /** @private */
  _bindRibbonTray() {
    const ribbon = document.getElementById("RibbonBar");
    const menu = document.getElementById("RibbonMenu") || ribbon?.parentElement;
    if (!ribbon) return;

    const onRibbonClick = (event) => {
      if (!this.enabled) return;
      if (event.target instanceof Element && event.target.closest(".Button")) {
        this.setRibbonOpen(false);
      }
    };

    const onPointerDown = (event) => {
      if (!this.ribbonOpen) return;
      if (menu && event.target instanceof Node && menu.contains(event.target)) return;
      this.setRibbonOpen(false);
    };

    ribbon.addEventListener("click", onRibbonClick);
    document.addEventListener("pointerdown", onPointerDown, true);
    this._cleanups.push(() => {
      ribbon.removeEventListener("click", onRibbonClick);
      document.removeEventListener("pointerdown", onPointerDown, true);
    });
  }

  destroy() {
    for (const cleanup of this._cleanups) cleanup?.();
    this._cleanups = [];
    this.tabs?.dom.remove();
    this.toggles.panels?.dom.remove();
    this.toggles.ribbon?.dom.remove();
    this.layout.container?.classList.remove("is-compact", "is-portrait", "is-landscape", "is-ribbon-open");
  }
}

export { CompactWorkspace };
