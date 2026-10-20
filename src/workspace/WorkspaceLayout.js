import { Container } from "../primitives/ui.js";

import { TabRegistry } from "./internal/TabRegistry.js";
import { WorkspaceStack } from "./internal/WorkspaceStack.js";
import { createLayoutResizerElement, bindLayoutResizerDrag } from "./resizers.js";
import { WorkspaceTabController } from "./tabController.js";
import { bindToggle } from "./moduleBridge.js";
import { installWorkspaceShortcuts } from "./keyboard.js";
import { Operator } from "../components/controls/Operator.js";
import { CompactWorkspace } from "./compact.js";

/**
 * @typedef {'left' | 'right' | 'bottom'} LayoutPosition
 * Position of a layout panel in the UI.
 */

/**
 * @typedef {Object} AddTabOptions
 * @property {boolean} [open=true] - Whether to open the panel after adding the tab.
 * @property {boolean} [replace=true] - Whether to replace an existing tab with the same ID.
 * @property {boolean} [floatable=false] - Show undock control on the WorkspacePanel header.
 * @property {Object<string, string>} [panelStyles] - Inline styles for the panel root (unused by stack; kept for callers).
 * @property {string} [group] - Panels that share a group move between regions together.
 * @property {string} [panelGroup='default'] - Optional subgroup within `group`.
 */

/**
 * @typedef {Object} RemoveTabOptions
 * @property {boolean} [closeIfEmpty=false] - Whether to close the panel if no tabs remain.
 */

/**
 * @typedef {Object} SelectTabOptions
 * @property {boolean} [open=true] - Whether to open the panel when selecting the tab.
 */

/**
 * @typedef {Object} WorkspaceLayoutConfig
 * @property {number} [leftWorkspaceWidth=300] - Default width for the left workspace in pixels.
 * @property {number} [rightWorkspaceWidth=300] - Default width for the right workspace in pixels.
 * @property {number} [bottomWorkspaceHeight=200] - Default height for the bottom workspace in pixels.
 * @property {number} [topWorkspaceHeight=36] - Height of the top bar row in pixels (grid row 1).
 * @property {number} [footerBarHeight=24] - Height of the persistent footer row in pixels.
 * @property {boolean} [leftOpen=false] - Whether the left workspace is open initially.
 * @property {boolean} [rightOpen=false] - Whether the right workspace is open initially.
 * @property {boolean} [bottomOpen=false] - Whether the bottom workspace is open initially.
 * @property {number} [minPanelSize=160] - Minimum workspace width/height in pixels.
 * @property {number} [resizerSize=4] - Size of the resizer handle in pixels.
 * @property {boolean} [enableViewportGrid=false] - Mount an empty grid host inside the viewport.
 * @property {import('./keyboard.js').WorkspaceShortcut[]} [shortcuts] - Override keyboard shortcuts.
 * @property {'auto'|boolean} [compact='auto'] - Compact shell for tablets and phones. `'auto'` switches on
 *   in any portrait container, at `compactBreakpoint` width, or on touch screens whose short side is within it.
 * @property {number} [compactBreakpoint=900] - Width in pixels at or below which `'auto'` goes compact.
 * @property {number} [compactBarHeight=52] - Height of the bottom ribbon menu bar in compact mode.
 * @property {number} [compactResizerSize=12] - Touch-sized splitter between viewport and workspace.
 * @property {number} [compactLandscapeRatio=0.4] - Workspace share of the width in landscape.
 * @property {number} [compactPortraitRatio=0.45] - Workspace share of the height in portrait.
 * @property {string|null} [compactTab=null] - Tab shown first in the compact workspace.
 * @property {boolean} [compactRibbonToggle=true] - Add a header button that opens the ribbon tray.
 *   Turn off when the application opens the tray itself (for example from work mode tabs).
 */

/** @type {WorkspaceLayoutConfig} */
const DEFAULT_CONFIG = {
  leftWorkspaceWidth: 375,
  rightWorkspaceWidth: 375,
  bottomWorkspaceHeight: 200,
  topWorkspaceHeight: 86,
  footerBarHeight: 24,
  leftOpen: false,
  rightOpen: false,
  bottomOpen: false,
  minPanelSize: 160,
  resizerSize: 7,
  enableViewportGrid: false,
  compact: 'auto',
  compactBreakpoint: 900,
  compactBarHeight: 52,
  compactResizerSize: 12,
  compactLandscapeRatio: 0.4,
  compactPortraitRatio: 0.45,
  compactTab: null,
  compactRibbonToggle: true,
};

/**
 * Workspace grid, exported as Layout.
 *
 * `new World()` builds the regions. `new Layout(options).init(world)` attaches
 * stacks, resizers, and the tab registry. Docked chrome is a Panel.
 * The layout does not run application commands. Subscribe with `on` and handle
 * the event in application code.
 *
 * ### Methods
 *
 * - `init(world)` — bind to a World, an element, or an element id
 * - `on(event, handler)` / `off(event, handler)` — `tab:added`, `tab:removed`, `tab:selected`, `workspace`,
 *   `compact`, `ribbon`
 * - `addTab(position, id, label, content, options?)`
 * - `ensureTab`, `removeTab`, `selectTab`, `toggleTab`, `hasTab`
 * - `getTabIds`, `getSelectedTabId`, `isTabSelected`, `clearTabs`, `setTabLabel`
 * - `openWorkspace`, `closeWorkspace`, `toggleWorkspace`, `isWorkspaceOpen`
 * - `setWorkspaceSize`, `getWorkspaceSize`, `resetLayout`
 * - `moveSegment(from, to, group)` — move every panel in a group
 * - `bindToggle(element, position, id)` — click handler for a button the app owns
 * - `prependToggleBarChild(node)` — insert a node into the header toggle row
 * - `getFloatingWindowMountElement()`
 * - `isCompact()`, `openRibbon()`, `closeRibbon()`, `toggleRibbon()`, `isRibbonOpen()`
 * - `destroy()`
 *
 * `position` is `"left"`, `"right"`, or `"bottom"`.
 *
 * On tablets and phones (see `compact`) the regions merge into one tabbed
 * workspace beside the viewport (landscape) or above it (portrait). The ribbon
 * menu moves to a bottom bar and `#RibbonBar` opens as a tray with `openRibbon`.
 * Region calls keep working: `openWorkspace` and `toggleWorkspace` show or hide
 * the shared workspace, and `selectTab` switches its tab.
 *
 * @example App
 * import { Text } from "@aeco-dev/gui";
 * import { World, Layout, Panel } from "@aeco-dev/layout";
 *
 * const world = new World();
 * world.mount(document.body);
 *
 * const layout = new Layout({ leftOpen: true }).init(world);
 *
 * layout.on("workspace", ({ position, open }) => {
 *   console.log(position, open);
 * });
 *
 * const layers = new Panel({
 *   layout,
 *   position: "left",
 *   id: "layers",
 *   label: "Layers",
 *   title: "Layers",
 *   icon: "layers",
 *   floatable: true,
 * });
 * layers.add(new Text("Layer list"));
 * layers.show();
 * layers.bindTo("layers-button");
 *
 * @category Shell
 */
class WorkspaceLayout {
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };

    this._hasExplicitLeftWorkspaceWidth = Number.isFinite(options.leftWorkspaceWidth);
    this._hasExplicitRightWorkspaceWidth = Number.isFinite(options.rightWorkspaceWidth);

    this.container = null;

    /** @type {{ left: WorkspaceStack|null, right: WorkspaceStack|null, bottom: WorkspaceStack|null }} */
    this.workspaceStacks = { left: null, right: null, bottom: null };

    this.tabRegistry = new TabRegistry();

    /** @type {Map<string, Set<(payload: object) => void>>} */
    this._listeners = new Map();

    this.workspaces = {
      top: null,
      left: null,
      right: null,
      bottom: null,
      footer: null,
      viewport: null,
    };

    this.resizers = {
      left: null,
      right: null,
      bottom: null,
    };

    this.state = {
      leftOpen: Boolean(this.config.leftOpen),
      rightOpen: Boolean(this.config.rightOpen),
      bottomOpen: Boolean(this.config.bottomOpen),
      leftWidth: this.config.leftWorkspaceWidth,
      rightWidth: this.config.rightWorkspaceWidth,
      bottomHeight: this.config.bottomWorkspaceHeight,
    };

    /** @type {Array<() => void>} */
    this._resizerCleanups = [];

    /** @type {(() => void) | null} */
    this._keyboardCleanup = null;

    /** @type {HTMLElement|null} */
    this._segmentDropHighlight = null;

    /** @type {any} */
    this.viewportGrid = null;

    /** Tab CRUD controller. Layout methods delegate here. */
    this.tabs = new WorkspaceTabController(this);

    this.compact = new CompactWorkspace(this);
  }

  _resolveInitialWorkspaceWidth(position) {
    const hasExplicit = position === 'left'
      ? this._hasExplicitLeftWorkspaceWidth
      : this._hasExplicitRightWorkspaceWidth;
    const configWidth = position === 'left'
      ? this.config.leftWorkspaceWidth
      : this.config.rightWorkspaceWidth;

    if (hasExplicit) {
      return Math.max(this.config.minPanelSize, configWidth);
    }

    const containerWidth = this.container && Number.isFinite(this.container.clientWidth)
      ? this.container.clientWidth
      : 0;

    if (containerWidth > 0) {
      return Math.max(this.config.minPanelSize, Math.round(containerWidth * 0.25));
    }

    return Math.max(this.config.minPanelSize, configWidth);
  }

  /**
   * @param {string | HTMLElement | { dom?: HTMLElement }} [target='World']
   * Element id, element, or a World instance.
   */
  init(target = 'World') {
    if (typeof target === 'string') {
      this.container = document.getElementById(target);
    } else if (target instanceof HTMLElement) {
      this.container = target;
    } else if (target?.dom instanceof HTMLElement) {
      this.container = target.dom;
    } else {
      this.container = null;
    }

    if (!this.container) return this;

    this.workspaces.top = document.getElementById('RibbonMenu') || document.getElementById('HeaderBar');
    this.workspaces.left = document.getElementById('WorkspaceLeft');
    this.workspaces.right = document.getElementById('WorkspaceRight');
    this.workspaces.bottom = document.getElementById('WorkspaceBottom');
    this.workspaces.footer = document.getElementById('Footer');
    this.workspaces.viewport = document.getElementById('Viewport');

    this.state.leftWidth = this._resolveInitialWorkspaceWidth('left');
    this.state.rightWidth = this._resolveInitialWorkspaceWidth('right');

    this._createViewportGrid();
    this._createWorkspaceStacks();
    this._createResizers();
    this._createToggleBar();
    this.compact.init();
    this.compact.sync();
    this._applyState();
    this._flushLayoutResize();
    this._onWindowResize = () => this._onResize();
    window.addEventListener('resize', this._onWindowResize);

    this._keyboardCleanup = installWorkspaceShortcuts(this, {
      shortcuts: this.config.shortcuts,
    });

    return this;
  }

  /**
   * Canonical DOM parent for full floating panels (drag/resize chrome). Matches the layout root
   * from init (typically #World), not #Windows.
   * @returns {HTMLElement|null}
   */
  getFloatingWindowMountElement() {
    const container = this.container;
    return container instanceof HTMLElement ? container : null;
  }

  /**
   * Move all panels sharing an ownerKey to another workspace region.
   * @param {'left' | 'right' | 'bottom'} fromPosition
   * @param {'left' | 'right' | 'bottom'} toPosition
   * @param {string} ownerKey
   * @returns {boolean}
   */
  moveSegment(fromPosition, toPosition, ownerKey) {
    if (!ownerKey || fromPosition === toPosition) {
      return false;
    }

    const fromStack = this.workspaceStacks[fromPosition];
    const toStack = this.workspaceStacks[toPosition];
    if (!fromStack || !toStack) {
      return false;
    }

    const moved = fromStack.extractPanelsByOwner(ownerKey);
    if (moved.length === 0) {
      return false;
    }

    for (const entry of moved) {
      toStack.adoptPanel(entry);

      if (entry.control && typeof entry.control === "object" && "position" in entry.control) {
        entry.control.position = toPosition;
      }

      const record = this.tabRegistry.get(entry.tabId);
      if (record) {
        this.tabRegistry.register({
          ...record,
          region: toPosition,
          panelElement: entry.panelElement,
          control: entry.control,
        });
      }

      this.tabs.rekeyTabFloatHandler(fromPosition, toPosition, entry.tabId);
    }

    if (!fromStack.hasAnyPanels()) {
      this.closeWorkspace(fromPosition);
    }

    this.openWorkspace(toPosition);
    this._flushLayoutResize();
    this._emit('workspace', {
      position: toPosition,
      open: true,
      movedFrom: fromPosition,
      ownerKey,
    });
    return true;
  }

  _createWorkspaceStacks() {
    for (const position of ['left', 'right', 'bottom']) {
      const hostElement = this.workspaces[position];
      if (!hostElement) {
        continue;
      }

      this.workspaceStacks[position] = new WorkspaceStack(hostElement, position, {
        onLayoutChange: () => {
          this.compact.refresh();
          this._flushLayoutResize();
        },
      });
    }
  }

  /**
   * Subscribe to a layout event.
   * @param {'tab:added'|'tab:removed'|'tab:selected'|'workspace'} event
   * @param {(payload: object) => void} handler
   * @returns {() => void} Unsubscribe.
   */
  on(event, handler) {
    if (typeof handler !== 'function') return () => {};
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * @param {'tab:added'|'tab:removed'|'tab:selected'|'workspace'} event
   * @param {(payload: object) => void} handler
   * @returns {this}
   */
  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
    return this;
  }

  prependToggleBarChild(domNode) {
    if (!domNode || !this.toggleBar) {
      return function noopToggleBarCleanup() {};
    }

    const toggleBarElement = this.toggleBar;

    if (toggleBarElement.firstChild) {
      toggleBarElement.insertBefore(domNode, toggleBarElement.firstChild);
    } else {
      toggleBarElement.appendChild(domNode);
    }

    return function removeToggleBarChild() {
      if (domNode.parentNode === toggleBarElement) {
        toggleBarElement.removeChild(domNode);
      }
    };
  }

  /**
   * @param {string} event
   * @param {object} payload
   */
  _emit(event, payload) {
    const handlers = this._listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) handler(payload);
  }

  _flushLayoutResize() {
    const fire = () => {
      window.dispatchEvent(new Event('resize'));
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(fire);
    } else {
      fire();
    }
  }

  /**
   * Float the selected panel for an owner group (or a specific tabId).
   * @param {'left' | 'right' | 'bottom'} position
   * @param {string} ownerKeyOrTabId
   * @returns {boolean}
   */
  floatSegmentTab(position, ownerKeyOrTabId) {
    const stack = this.workspaceStacks[position];
    if (!stack || !ownerKeyOrTabId) {
      return false;
    }

    const selected = stack.selectedTabId;
    const candidates = stack.panelEntries.filter((entry) => (
      entry.ownerKey === ownerKeyOrTabId || entry.tabId === ownerKeyOrTabId
    ));

    const target = candidates.find((entry) => entry.tabId === selected)
      || candidates[0];
    if (!target) {
      return false;
    }

    const fn = this.tabs.getTabFloatHandler(position, target.tabId);
    if (typeof fn === 'function') {
      fn();
      return true;
    }

    return false;
  }


  // ---------------------------------------------------------------------------
  // Tab CRUD facade — delegates to WorkspaceTabController. Public API unchanged.
  // ---------------------------------------------------------------------------

  /**
   * @param {'left'|'right'|'bottom'} position
   * @param {string} id
   * @param {string} label
   * @param {import('../primitives/ui.js').Control|HTMLElement} content
   * @param {AddTabOptions} [options]
   * @returns {boolean}
   */
  addTab(position, id, label, content, options) {
    return this.tabs.addTab(position, id, label, content, options);
  }

  ensureTab(position, id, label, content, options) {
    return this.tabs.ensureTab(position, id, label, content, options);
  }

  removeTab(position, id, options) {
    return this.tabs.removeTab(position, id, options);
  }

  selectTab(position, id, options) {
    return this.tabs.selectTab(position, id, options);
  }

  toggleTab(position, id) {
    if (this.compact.enabled) {
      if (!this.hasTab(position, id)) return false;
      if (this.compact.open && this.compact.activeTabId === id) {
        this.compact.setOpen(false);
      } else {
        this.selectTab(position, id, { open: true });
      }
      return true;
    }
    return this.tabs.toggleTab(position, id);
  }

  hasTab(position, id) {
    return this.tabs.hasTab(position, id);
  }

  getTabIds(position, filter) {
    return this.tabs.getTabIds(position, filter);
  }

  getSelectedTabId(position) {
    return this.tabs.getSelectedTabId(position);
  }

  isTabSelected(position, id) {
    if (this.compact.enabled) {
      return this.compact.activeTabId === id && this.hasTab(position, id);
    }
    return this.tabs.isTabSelected(position, id);
  }

  clearTabs(position, closeWorkspace = true) {
    return this.tabs.clearTabs(position, closeWorkspace);
  }

  setTabLabel(position, id, label) {
    return this.tabs.setTabLabel(position, id, label);
  }

  registerTabFloatHandler(position, tabId, fn) {
    return this.tabs.registerTabFloatHandler(position, tabId, fn);
  }

  invokeTabFloat(position, tabId) {
    return this.tabs.invokeTabFloat(position, tabId);
  }

  /**
   * Click handler for a button the application owns.
   * The button gets an `Active` class while this tab is the selected tab in an open region.
   * @param {string|HTMLElement} elementOrId
   * @param {'left'|'right'|'bottom'} position
   * @param {string} tabId
   * @returns {Function|null}
   */
  bindToggle(elementOrId, position, tabId) {
    return bindToggle(this, elementOrId, position, tabId);
  }

  // ---------------------------------------------------------------------------
  // Layout, grid, resizers, toggle bar
  // ---------------------------------------------------------------------------

  _createViewportGrid() {
    if (!this.config.enableViewportGrid || !this.workspaces.viewport) {
      return;
    }

    const host = new Container()
      .setStyles({
        position: "absolute",
        inset: "0",
        display: "flex",
        alignItems: "stretch",
      });
    this.workspaces.viewport.insertBefore(host.dom, this.workspaces.viewport.firstChild);
    this.viewportGrid = { mount: () => {}, host: host.dom };
  }

  getViewportGrid() {
    return this.viewportGrid;
  }

  _createResizers() {
    this.resizers.left = this._createResizer('left');
    this.resizers.right = this._createResizer('right');
    this.resizers.bottom = this._createResizer('bottom');

    this.container.appendChild(this.resizers.left);
    this.container.appendChild(this.resizers.right);
    this.container.appendChild(this.resizers.bottom);
  }

  _createToggleBar() {
    this.toggleBar = document.getElementById('LayoutToggleBar');
    if (!this.toggleBar) {
      this.toggleButtons = null;
      return;
    }

    this.toggleButtons = {
      left: this._createToggleButton('left', 'left_panel_open', 'Toggle Left Workspace (Ctrl+B)'),
      bottom: this._createToggleButton('bottom', 'bottom_panel_open', 'Toggle Bottom Workspace (Ctrl+J)'),
      right: this._createToggleButton('right', 'right_panel_open', 'Toggle Right Workspace (Ctrl+Alt+B)'),
    };
  }

  _createToggleButton(position, iconName, tooltip) {
    const button = new Operator(iconName).setTooltip(tooltip);
    button.dom.dataset.position = position;

    button.onClick((event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggleWorkspace(position);
    });

    this.toggleBar.appendChild(button.dom);

    return button;
  }

  _updateToggleButtons() {
    if (!this.toggleButtons) {
      return;
    }

    for (const [position, button] of Object.entries(this.toggleButtons)) {
      const isOpen = this.state[`${position}Open`];
      button.dom.classList.toggle('Active', isOpen);
    }
  }

  _createResizer(position) {
    const resizerDom = createLayoutResizerElement(position, this.config.resizerSize);
    resizerDom.dataset.position = position;

    const cleanup = bindLayoutResizerDrag(resizerDom, {
      onDragStart: (event) => {
        const workspace = position === 'left'
          ? this.workspaces.left
          : position === 'right'
            ? this.workspaces.right
            : this.workspaces.bottom;

        if (!workspace) {
          return null;
        }

        const rect = workspace.getBoundingClientRect();

        return {
          position,
          startX: event.clientX,
          startY: event.clientY,
          startWidth: rect.width,
          startHeight: rect.height,
        };
      },
      onDragMove: (event, dragState) => {
        this._applyWorkspaceResizerDrag(event, dragState);
      },
      onDoubleClick: () => {
        this._onDoubleClick(position);
      },
    });

    this._resizerCleanups.push(cleanup);
    return resizerDom;
  }

  _applyWorkspaceResizerDrag(event, dragState) {
    const { position, startX, startY, startWidth, startHeight } = dragState;
    const minSize = this.config.minPanelSize;

    if (position === 'left') {
      this.state.leftWidth = Math.max(minSize, startWidth + (event.clientX - startX));
    } else if (position === 'right') {
      this.state.rightWidth = Math.max(minSize, startWidth + (startX - event.clientX));
    } else if (position === 'bottom') {
      this.state.bottomHeight = Math.max(minSize, startHeight + (startY - event.clientY));
    }

    this._updateGridForPosition(position);
    window.dispatchEvent(new Event('resize'));
  }

  _updateGridForPosition(position) {
    if (this.compact.enabled) {
      this.compact.apply();
      return;
    }

    if (position === 'bottom') {
      this._updateGridRows();
    } else {
      this._updateGridColumns();
    }

    this._updateWorkspaceVisibility();
  }

  _updateWorkspaceVisibility() {
    for (const position of ['left', 'right', 'bottom']) {
      const workspace = this.workspaces[position];
      if (!workspace) {
        continue;
      }

      const isOpen = this.state[`${position}Open`];
      workspace.style.display = isOpen ? '' : 'none';
    }
  }

  _onDoubleClick(position) {
    this.toggleWorkspace(position);
  }

  _updateGridColumns() {
    const resizer = this.config.resizerSize;
    const leftOpen = this.state.leftOpen;
    const rightOpen = this.state.rightOpen;
    let left = leftOpen ? this.state.leftWidth : 0;
    let right = rightOpen ? this.state.rightWidth : 0;
    const width = this.container.clientWidth;
    const chrome = (leftOpen ? resizer : 0) + (rightOpen ? resizer : 0);
    const docks = left + right;
    const viewportFloor = Math.min(280, Math.round(width * 0.34));
    if (width > 0 && docks > 0 && docks > width - chrome - viewportFloor) {
      const room = Math.max(0, width - chrome - viewportFloor);
      const scale = room / docks;
      left = Math.round(left * scale);
      right = Math.round(right * scale);
    }

    this.container.style.gridTemplateColumns =
      `${left}px ${leftOpen ? resizer : 0}px minmax(0, 1fr) ${rightOpen ? resizer : 0}px ${right}px`;

    this.resizers.left.style.display = leftOpen ? 'block' : 'none';
    this.resizers.right.style.display = rightOpen ? 'block' : 'none';
  }

  _updateGridRows() {
    const bottomHeight = this.state.bottomOpen ? `${this.state.bottomHeight}px` : '0px';
    const bottomResizer = this.state.bottomOpen ? `${this.config.resizerSize}px` : '0px';
    const topRow = `${this.config.topWorkspaceHeight}px`;
    const footerRow = `${this.config.footerBarHeight}px`;

    this.container.style.gridTemplateRows =
      `${topRow} minmax(0, 1fr) ${bottomResizer} ${bottomHeight} ${footerRow}`;

    this.resizers.bottom.style.display = this.state.bottomOpen ? 'block' : 'none';
  }

  _applyState() {
    if (this.compact.enabled) {
      this.compact.apply();
      return;
    }

    this._updateGridColumns();
    this._updateGridRows();
    this._updateWorkspaceVisibility();
    this._updateToggleButtons();
  }

  _onResize() {
    const changed = this.compact.sync();
    if (this.compact.enabled || changed) {
      this._applyState();
    } else {
      this._updateGridColumns();
    }

    if (changed) {
      this._flushLayoutResize();
      this._emit('compact', { compact: this.compact.enabled, portrait: this.compact.portrait });
    }
  }

  /** @returns {boolean} Whether the compact tablet/phone shell is active. */
  isCompact() {
    return this.compact.enabled;
  }

  /** Open the ribbon tray above the bottom bar. No-op outside compact mode. */
  openRibbon() {
    this.compact.setRibbonOpen(true);
    return this;
  }

  closeRibbon() {
    this.compact.setRibbonOpen(false);
    return this;
  }

  toggleRibbon() {
    this.compact.setRibbonOpen(!this.compact.ribbonOpen);
    return this;
  }

  isRibbonOpen() {
    return this.compact.ribbonOpen;
  }

  toggleWorkspace(position) {
    if (this.compact.enabled) {
      this.compact.toggle();
      return this;
    }

    this.state[`${position}Open`] = !this.state[`${position}Open`];
    this._updateGridForPosition(position);
    this._updateToggleButtons();
    this._flushLayoutResize();
    return this;
  }

  openWorkspace(position) {
    if (this.compact.enabled) {
      this.compact.setOpen(true);
      return this;
    }

    const openKey = `${position}Open`;
    const wasOpen = this.state[openKey];
    if (!wasOpen) {
      this.state[openKey] = true;
      this._updateGridForPosition(position);
      this._updateToggleButtons();
      this._flushLayoutResize();
      this._emit('workspace', { position, open: true });
    }
    return this;
  }

  closeWorkspace(position) {
    if (this.compact.enabled) {
      if (this.compact.regionOf(this.compact.activeTabId) === position) this.compact.setOpen(false);
      return this;
    }

    const openKey = `${position}Open`;
    const wasOpen = this.state[openKey];
    if (wasOpen) {
      this.state[openKey] = false;
      this._updateGridForPosition(position);
      this._updateToggleButtons();
      this._flushLayoutResize();
      this._emit('workspace', { position, open: false });
    }
    return this;
  }

  setWorkspaceSize(position, size) {
    size = Math.max(this.config.minPanelSize, size);

    if (position === 'left') {
      this.state.leftWidth = size;
    } else if (position === 'right') {
      this.state.rightWidth = size;
    } else if (position === 'bottom') {
      this.state.bottomHeight = size;
    } else {
      return this;
    }

    this._updateGridForPosition(position);
    this._updateToggleButtons();
    this._flushLayoutResize();
    return this;
  }

  getWorkspaceSize(position) {
    if (position === 'left') return this.state.leftWidth;
    if (position === 'right') return this.state.rightWidth;
    if (position === 'bottom') return this.state.bottomHeight;
    return 0;
  }

  isWorkspaceOpen(position) {
    if (this.compact.enabled) return this.compact.open;
    return Boolean(this.state[`${position}Open`]);
  }

  resetLayout() {
    this.state = {
      leftOpen: Boolean(this.config.leftOpen),
      rightOpen: Boolean(this.config.rightOpen),
      bottomOpen: Boolean(this.config.bottomOpen),
      leftWidth: this._resolveInitialWorkspaceWidth('left'),
      rightWidth: this._resolveInitialWorkspaceWidth('right'),
      bottomHeight: this.config.bottomWorkspaceHeight,
    };

    this.compact.open = true;
    this.compact.ratio = {
      landscape: this.config.compactLandscapeRatio,
      portrait: this.config.compactPortraitRatio,
    };

    this._applyState();
    this._flushLayoutResize();

    return this;
  }

  destroy() {
    this.compact.destroy();

    for (const cleanup of this._resizerCleanups) {
      cleanup();
    }
    this._resizerCleanups = [];

    if (typeof this._keyboardCleanup === 'function') {
      this._keyboardCleanup();
      this._keyboardCleanup = null;
    }

    if (this._onWindowResize) {
      window.removeEventListener('resize', this._onWindowResize);
      this._onWindowResize = null;
    }

    this._listeners.clear();

    Object.values(this.resizers).forEach((resizer) => {
      if (resizer && resizer.parentNode) {
        resizer.remove();
      }
    });
  }
}

export { WorkspaceLayout };
export default WorkspaceLayout;
