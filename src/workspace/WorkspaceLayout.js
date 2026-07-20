import { Container } from "../primitives/ui.js";

import { TabRegistry } from "./internal/TabRegistry.js";
import { WorkspaceStack } from "./internal/WorkspaceStack.js";
import { createLayoutResizerElement, bindLayoutResizerDrag } from "./resizers.js";
import { WorkspaceTabController } from "./tabController.js";
import {
  resolveModuleToggleId,
  bindToggle,
  bindToggleForModule,
} from "./moduleBridge.js";
import { installWorkspaceShortcuts } from "./keyboard.js";
import { Operator } from "../components/controls/Operator.js";

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
 * @property {string} [moduleId] - Module id used to group panels for region moves.
 * @property {string} [panelGroup='default'] - Optional group key within a module.
 * @property {string} [ownerId] - Explicit owner when moduleId is absent.
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
 * @property {boolean} [enableViewportGrid=false] - Mount optional viewport grid host (app-specific).
 * @property {import('./keyboard.js').WorkspaceShortcut[]} [shortcuts] - Override keyboard shortcuts.
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
};

/**
 * Workspace grid manager: region open/close/size, stack mount points, and panel
 * registry. Does not create or style panel chrome — docked UI is a
 * {@link WorkspacePanel} ({@link CollapsiblePanel} subclass) owned by the app.
 *
 * @example <caption>Note</caption>
 * // live
 * return new Disclaimer(
 *   "WorkspaceLayout requires a full #World DOM tree — use the templates example app.",
 * );
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

    this.context = null;

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

  init(containerId = 'World') {
    this.container = document.getElementById(containerId);

    if (!this.container) return this;

    this.container.classList.add('workspace-layout');

    this.workspaces.top = document.getElementById('RibbonMenu') || document.getElementById('HeaderBar');
    this.workspaces.left = document.getElementById('SideWorkspaceLeft');
    this.workspaces.right = document.getElementById('SideWorkspaceRight');
    this.workspaces.bottom = document.getElementById('BottomWorkspace');
    this.workspaces.footer = document.getElementById('FooterBar');
    this.workspaces.viewport = document.getElementById('Viewport');

    this.state.leftWidth = this._resolveInitialWorkspaceWidth('left');
    this.state.rightWidth = this._resolveInitialWorkspaceWidth('right');

    this._setupLayout();
    this._createViewportGrid();
    this._createWorkspaceStacks();
    this._createResizers();
    this._createToggleBar();
    this._applyState();
    this._flushLayoutResize();

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
    this._emit('layoutWorkspaceChanged', {
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
          this._flushLayoutResize();
        },
      });
    }
  }

  setContext(context) {
    this.context = context || null;
    if (this.context && typeof this.context.addListeners === 'function') {
      this.context.addListeners([
        'layoutTabChanged',
        'layoutTabAdded',
        'layoutTabRemoved',
        'layoutWorkspaceChanged',
      ]);
    }
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

  _emit(signalName, payload) {
    const ctx = this.context;
    if (!ctx) return;
    const signals = ctx.signals;
    if (!signals) return;
    const sig = signals[signalName];
    if (sig && typeof sig.dispatch === 'function') {
      sig.dispatch(payload);
    }
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

  // ---------------------------------------------------------------------------
  // Module/toolbar bridge — thin wrappers around moduleBridge.js.
  // ---------------------------------------------------------------------------

  /**
   * @param {Object} context
   * @param {string} moduleId
   * @returns {string|null}
   */
  resolveModuleToggleId(context, moduleId) {
    return resolveModuleToggleId(context, moduleId);
  }

  bindToggle(elementOrId, position, tabId) {
    return bindToggle(this, elementOrId, position, tabId);
  }

  bindToggleForModule(moduleId, position, tabId, options) {
    return bindToggleForModule(this, moduleId, position, tabId, options);
  }

  // ---------------------------------------------------------------------------
  // Layout, grid, resizers, toggle bar
  // ---------------------------------------------------------------------------

  _setupLayout() {
    this.container.style.display = 'grid';
    this.container.style.overflow = 'hidden';

    if (this.workspaces.top) {
      this.workspaces.top.style.overflow = 'hidden';
      this.workspaces.top.classList.add('layout-panel', 'layout-panel-top');
    }

    if (this.workspaces.left) {
      this.workspaces.left.style.overflowX = 'hidden';
      this.workspaces.left.style.overflowY = 'auto';
      this.workspaces.left.style.minWidth = '0';
      this.workspaces.left.style.minHeight = '0';
      this.workspaces.left.classList.add('layout-panel', 'layout-panel-left');
    }

    if (this.workspaces.right) {
      this.workspaces.right.style.overflowX = 'hidden';
      this.workspaces.right.style.overflowY = 'auto';
      this.workspaces.right.style.minWidth = '0';
      this.workspaces.right.style.minHeight = '0';
      this.workspaces.right.classList.add('layout-panel', 'layout-panel-right');
    }

    if (this.workspaces.bottom) {
      this.workspaces.bottom.style.overflowX = 'hidden';
      this.workspaces.bottom.style.overflowY = 'auto';
      this.workspaces.bottom.style.minHeight = '0';
      this.workspaces.bottom.classList.add('layout-panel', 'layout-panel-bottom');
    }

    if (this.workspaces.footer) {
      this.workspaces.footer.style.overflow = 'hidden';
      this.workspaces.footer.classList.add('layout-panel', 'layout-panel-footer');
    }

    if (this.workspaces.viewport) {
      this.workspaces.viewport.style.overflow = 'hidden';
      this.workspaces.viewport.style.position = 'relative';
      this.workspaces.viewport.classList.add('layout-viewport');
    }
  }

  _createViewportGrid() {
    if (!this.config.enableViewportGrid || !this.workspaces.viewport) {
      return;
    }

    const host = new Container()
      .addClass("viewport-grid-host")
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
    const leftWidth = this.state.leftOpen ? `${this.state.leftWidth}px` : '0px';
    const leftResizer = this.state.leftOpen ? `${this.config.resizerSize}px` : '0px';
    const rightWidth = this.state.rightOpen ? `${this.state.rightWidth}px` : '0px';
    const rightResizer = this.state.rightOpen ? `${this.config.resizerSize}px` : '0px';

    this.container.style.gridTemplateColumns =
      `${leftWidth} ${leftResizer} minmax(0, 1fr) ${rightResizer} ${rightWidth}`;

    this.resizers.left.style.display = this.state.leftOpen ? 'block' : 'none';
    this.resizers.right.style.display = this.state.rightOpen ? 'block' : 'none';
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
    this._updateGridColumns();
    this._updateGridRows();
    this._updateWorkspaceVisibility();
    this._updateToggleButtons();
  }

  toggleWorkspace(position) {
    this.state[`${position}Open`] = !this.state[`${position}Open`];
    this._updateGridForPosition(position);
    this._updateToggleButtons();
    this._flushLayoutResize();
    return this;
  }

  openWorkspace(position) {
    const openKey = `${position}Open`;
    const wasOpen = this.state[openKey];
    if (!wasOpen) {
      this.state[openKey] = true;
      this._updateGridForPosition(position);
      this._updateToggleButtons();
      this._flushLayoutResize();
      this._emit('layoutWorkspaceChanged', { position, open: true });
    }
    return this;
  }

  closeWorkspace(position) {
    const openKey = `${position}Open`;
    const wasOpen = this.state[openKey];
    if (wasOpen) {
      this.state[openKey] = false;
      this._updateGridForPosition(position);
      this._updateToggleButtons();
      this._flushLayoutResize();
      this._emit('layoutWorkspaceChanged', { position, open: false });
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

    this._applyState();
    this._flushLayoutResize();

    return this;
  }

  destroy() {
    for (const cleanup of this._resizerCleanups) {
      cleanup();
    }
    this._resizerCleanups = [];

    if (typeof this._keyboardCleanup === 'function') {
      this._keyboardCleanup();
      this._keyboardCleanup = null;
    }

    Object.values(this.resizers).forEach((resizer) => {
      if (resizer && resizer.parentNode) {
        resizer.remove();
      }
    });
  }
}

export { WorkspaceLayout };
export default WorkspaceLayout;
