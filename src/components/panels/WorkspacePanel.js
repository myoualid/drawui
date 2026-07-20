import { Icon } from "../../primitives/ui.js";
import { FloatingWindow } from "../../overlays/FloatingWindow.js";
import { buildWorkspaceDockHandlers, resolveFloatingMountElement } from "../../workspace/dock.js";
import { resolveModuleToggleId } from "../../workspace/moduleBridge.js";
import { resolveOwnerKey } from "../../workspace/internal/TabRegistry.js";
import { bindPanelRegionDrag } from "../../workspace/panelDrag.js";
import { CollapsiblePanel } from "./CollapsiblePanel.js";

/**
 * @typedef {'left' | 'right' | 'bottom'} WorkspaceRegion
 */

const WORKSPACE_REGIONS = new Set(["left", "right", "bottom"]);

/**
 * {@link CollapsiblePanel} for {@link WorkspaceLayout} regions.
 *
 * Owns docked chrome (collapse + optional undock). The layout system only mounts,
 * moves, and tracks panels — it does not create or style this component.
 *
 * @example
 * const panel = new WorkspacePanel({
 *   context, position: 'right', tabId: 'settings', tabLabel: 'Settings',
 * });
 * panel.add(new TextBlock('Settings'));
 * panel.show();
 *
 * @category Panels
 */
export class WorkspacePanel extends CollapsiblePanel {
  /**
   * @param {Object} options
   * @param {Object} options.context
   * @param {WorkspaceRegion} [options.position='right']
   * @param {string} options.tabId
   * @param {string} options.tabLabel
   * @param {string} [options.icon]
   * @param {string} [options.title]
   * @param {Object} [options.panelStyles]
   * @param {boolean} [options.showHeader=true]
   * @param {boolean} [options.autoShow=false]
   * @param {string} [options.moduleId]
   * @param {string} [options.ownerId]
   * @param {string} [options.toggleElementId]
   * @param {string} [options.panelGroup='default']
   * @param {boolean} [options.floatable=false]
   * @param {boolean} [options.startFloating=false]
   * @param {Object} [options.floatingStyles]
   * @param {boolean} [options.floatingClosable=true]
   */
  constructor(options = {}) {
    const {
      context,
      operators,
      position = "right",
      tabId,
      tabLabel,
      icon,
      title,
      panelStyles = {},
      showHeader = true,
      autoShow = false,
      moduleId,
      ownerId,
      toggleElementId,
      panelGroup = "default",
      floatable = false,
      startFloating = false,
      floatingStyles = null,
      floatingClosable = true,
      collapsed = false,
    } = options;

    if (!tabId) throw new Error("WorkspacePanel requires a tabId");
    if (!tabLabel) throw new Error("WorkspacePanel requires a tabLabel");
    if (!WORKSPACE_REGIONS.has(position)) {
      throw new Error(`WorkspacePanel requires a WorkspaceRegion (left|right|bottom), got: ${position}`);
    }

    super({
      context,
      operators,
      moduleId,
      icon,
      title: title || tabLabel,
      showHeader,
      showFooter: false,
      collapsed,
      position: null,
      resizable: false,
      draggable: false,
      resizeHandles: [],
      // Inherit CollapsiblePanel sizing (fit-content). Do not force fill-height
      // layout — that fights expand/collapse and hides PanelContent.
      panelStyles,
    });

    this.addClass("WorkspacePanel");
    this.position = position;
    this.tabId = tabId;
    this.tabLabel = tabLabel;
    this.icon = icon;
    this.title = title || tabLabel;
    this.ownerId = ownerId || null;
    this.panelGroup = panelGroup || "default";
    this.toggleElementId = toggleElementId || resolveModuleToggleId(context, moduleId);
    this.panelStyles = panelStyles;
    this.floatingStyles = floatingStyles || {};

    this._isShown = false;
    this._unbindToggle = null;
    this._syncBoundToggleActive = null;
    this._signalCleanup = null;
    this._floatHandlerCleanup = null;
    this._regionDragCleanup = null;
    this._floatAction = null;
    this._detachedFloatingWindow = null;
    this._savedFloatGeometry = null;
    this._floatable = floatable;
    this._startFloating = startFloating;
    this._floatingClosable = floatingClosable;

    this._subscribeToSignals();

    const lm = this.layoutManager;
    if (floatable && !startFloating && lm) {
      this._installFloatAction();
      this._floatHandlerCleanup = lm.registerTabFloatHandler(
        this.position,
        this.tabId,
        () => this.detachToFloatingWindow(),
      );
    }

    if (this.toggleElementId) this.bindTo(this.toggleElementId);
    if (autoShow) this.show();
  }

  /** @returns {string} */
  get ownerKey() {
    return resolveOwnerKey({
      moduleId: this.moduleId,
      ownerId: this.ownerId,
      tabId: this.tabId,
    });
  }

  /** @private */
  _installFloatAction() {
    if (this._floatAction || !this._header) return;

    const floatIcon = new Icon("open_in_new");
    floatIcon.addClass("WorkspacePanel-float");
    floatIcon.dom.title = "Undock to floating window";
    floatIcon.setStyle("font-size", ["16px"]);
    floatIcon.onClick((event) => {
      event.preventDefault();
      event.stopPropagation();
      this.detachToFloatingWindow();
    });

    this._header.addAction(floatIcon);
    this._floatAction = floatIcon;
  }

  get layoutManager() {
    return this.context?.ui?.model?.layoutManager || null;
  }

  _tabOptions(extra = {}) {
    return {
      floatable: this._floatable,
      panelStyles: this.panelStyles,
      moduleId: this.moduleId,
      ownerId: this.ownerId,
      panelGroup: this.panelGroup,
      ...extra,
    };
  }

  _syncToggleActive() {
    this._syncBoundToggleActive?.();
  }

  _shown() {
    this._isShown = true;
    this._bindRegionDrag();
    this.onShow();
    this._syncToggleActive();
    return this;
  }

  /** @private */
  _bindRegionDrag() {
    this._regionDragCleanup?.();
    this._regionDragCleanup = null;

    const lm = this.layoutManager;
    const handle = this._header?.dom;
    if (!lm || !handle || this._detachedFloatingWindow) return;

    this._regionDragCleanup = bindPanelRegionDrag(lm, {
      getFromPosition: () => this.position,
      getOwnerKey: () => this.ownerKey,
      panelElement: this.dom,
      handleElement: handle,
      isIgnoredTarget: (target) => (
        target instanceof Element && Boolean(
          target.closest(".CollapsiblePanel-toggle")
          || target.closest(".WorkspacePanel-float")
          || target.closest("button")
          || target.closest("a"),
        )
      ),
    });
  }

  /** @private */
  _unbindRegionDrag() {
    this._regionDragCleanup?.();
    this._regionDragCleanup = null;
  }

  _subscribeToSignals() {
    const signals = this.context?.signals;
    if (!signals) return;

    const unsubs = [];
    const sub = (name, handler) => {
      const sig = signals[name];
      if (!sig || typeof sig.add !== "function") return;
      sig.add(handler);
      unsubs.push(() => sig.remove?.(handler));
    };

    sub("layoutTabChanged", (payload) => {
      if (payload.position === this.position && payload.id === this.tabId) this.onTabSelected();
      else if (payload.position === this.position && this._isShown) this.onTabDeselected();
    });

    sub("layoutTabRemoved", (payload) => {
      if (payload.position === this.position && payload.id === this.tabId) {
        this._isShown = false;
        this.onHide();
      }
    });

    this._signalCleanup = () => {
      for (const u of unsubs) u();
    };
  }

  /**
   * Show as a workspace tab (or floating host).
   * @param {{ select?: boolean, open?: boolean }} [options]
   * @returns {this}
   */
  show(options = {}) {
    const { select = true, open = select } = options;
    const lm = this.layoutManager;
    if (!lm && !this._startFloating) {
      console.warn("WorkspacePanel: WorkspaceLayout not available");
      return this;
    }

    if (this._detachedFloatingWindow) {
      const mountEl = resolveFloatingMountElement(lm);
      if (this._detachedFloatingWindow.isClosed || !this._detachedFloatingWindow.dom.parentElement) {
        this._detachedFloatingWindow.mountFloating(mountEl);
      } else {
        this._detachedFloatingWindow.restore();
      }
      return this._shown();
    }

    if (this._startFloating && !(lm && lm.hasTab(this.position, this.tabId))) {
      this.detachToFloatingWindow({ removeTab: false, callHide: false });
      return this._shown();
    }

    if (lm.hasTab(this.position, this.tabId)) {
      if (select) lm.selectTab(this.position, this.tabId);
      return this._shown();
    }

    lm.addTab(this.position, this.tabId, this.tabLabel, this, this._tabOptions({ open, replace: true }));
    if (select) lm.selectTab(this.position, this.tabId);
    return this._shown();
  }

  /**
   * @param {{ closeIfEmpty?: boolean }} [options]
   * @returns {this}
   */
  hide(options = {}) {
    if (this._detachedFloatingWindow) {
      this._detachedFloatingWindow.hide();
      this.onHide();
      this._syncToggleActive();
      return this;
    }

    const lm = this.layoutManager;
    if (!lm) return this;
    this._unbindRegionDrag();
    lm.removeTab(this.position, this.tabId, { closeIfEmpty: options.closeIfEmpty ?? false });
    this._isShown = false;
    this.onHide();
    this._syncToggleActive();
    return this;
  }

  /**
   * Undock: move panel body into a {@link FloatingWindow}. Docked chrome stays
   * a {@link CollapsiblePanel}; floating chrome is the window title bar.
   * @returns {FloatingWindow|null}
   */
  detachToFloatingWindow(options = {}) {
    const { removeTab = true, callHide = true } = options;
    const lm = this.layoutManager;

    if (this._detachedFloatingWindow) {
      this._detachedFloatingWindow.mountFloating(resolveFloatingMountElement(lm));
      return this._detachedFloatingWindow;
    }

    this._floatHandlerCleanup?.();
    this._floatHandlerCleanup = null;
    this._unbindRegionDrag();

    const fp = new FloatingWindow({
      title: this.title,
      icon: this.icon,
      closable: this._floatingClosable,
      sourceWorkspacePanel: this,
      dock: buildWorkspaceDockHandlers({
        layoutManager: lm,
        tabId: this.tabId,
        tabLabel: this.tabLabel,
      }),
    });

    fp.onClose(() => {
      this._isShown = false;
      this.onHide();
      this._syncToggleActive();
    });

    if (this.floatingStyles) fp.setStyles(this.floatingStyles);

    while (this._body.dom.firstChild) {
      fp.content.appendChild(this._body.dom.firstChild);
    }

    if (removeTab && lm) {
      lm.removeTab(this.position, this.tabId, { closeIfEmpty: true });
      this._isShown = false;
      if (callHide) this.onHide();
    } else if (this.dom.parentNode) {
      this.dom.remove();
    }

    const mountEl = resolveFloatingMountElement(lm);
    if (mountEl) {
      fp.mountFloating(mountEl);
      if (this._savedFloatGeometry) {
        const { left, top, width, height } = this._savedFloatGeometry;
        if (left) fp.dom.style.left = left;
        if (top) fp.dom.style.top = top;
        if (width) fp.dom.style.width = width;
        if (height) fp.dom.style.height = height;
      }
    }

    this._detachedFloatingWindow = fp;
    return fp;
  }

  restoreContentFromFloatingWindow(floatingPanel, layoutManager, position, tabId, tabLabel) {
    if (!layoutManager || !floatingPanel?.content) return;

    const floatContent = floatingPanel.content;
    this._detachedFloatingWindow = null;
    this.position = position;
    this._floatHandlerCleanup?.();
    this._floatHandlerCleanup = null;

    while (floatContent.firstChild) {
      this._body.dom.appendChild(floatContent.firstChild);
    }

    const label = tabLabel != null && tabLabel !== "" ? tabLabel : this.tabLabel;
    layoutManager.addTab(position, tabId, label, this, this._tabOptions({ open: true, replace: true }));
    layoutManager.selectTab(position, tabId, { open: true });
    this._shown();

    if (this._floatable) {
      this._installFloatAction();
      this._floatHandlerCleanup = layoutManager.registerTabFloatHandler(
        position,
        tabId,
        () => this.detachToFloatingWindow(),
      );
    }

    this._bindRegionDrag();

    floatingPanel._sourceWorkspacePanel = null;
    const fpDom = floatingPanel.dom;
    if (fpDom) {
      const { left, top, width, height } = fpDom.style;
      if (left || top) this._savedFloatGeometry = { left, top, width, height };
      fpDom.parentNode?.removeChild(fpDom);
    }
  }

  /** Workspace show/hide — use {@link CollapsiblePanel#toggleCollapse} for body. */
  toggle() {
    if (this._detachedFloatingWindow) {
      return this.isVisible() ? this.hide() : this.show();
    }

    const lm = this.layoutManager;
    if (!lm) return this;

    if (this._isShown) {
      if (lm.isWorkspaceOpen(this.position) && lm.isTabSelected(this.position, this.tabId)) {
        lm.closeWorkspace(this.position);
      } else {
        lm.selectTab(this.position, this.tabId, { open: true });
      }
    } else {
      this.show();
    }
    return this;
  }

  select() {
    if (this._detachedFloatingWindow) return this.show();
    const lm = this.layoutManager;
    if (!lm) return this;
    if (!this._isShown) return this.show();
    lm.selectTab(this.position, this.tabId, { open: true });
    return this;
  }

  isVisible() {
    if (this._detachedFloatingWindow) {
      return this._detachedFloatingWindow.dom.style.display !== "none"
        && Boolean(this._detachedFloatingWindow.dom.parentElement)
        && !this._detachedFloatingWindow.isClosed;
    }
    return this._isShown;
  }

  isFloating() {
    return Boolean(this._detachedFloatingWindow);
  }

  getFloatingWindow() {
    return this._detachedFloatingWindow;
  }

  setFloatingStyles(styles = {}) {
    this.floatingStyles = styles || {};
    if (this._detachedFloatingWindow) this._detachedFloatingWindow.setStyles(this.floatingStyles);
    return this;
  }

  isSelected() {
    return Boolean(this.layoutManager?.isTabSelected(this.position, this.tabId));
  }

  bindTo(elementOrId) {
    this._unbindToggle?.();
    this._unbindToggle = null;

    const lm = this.layoutManager;
    if (this._startFloating || !lm) {
      this._unbindToggle = this._bindDirectToggle(elementOrId);
      return this;
    }

    lm.ensureTab(this.position, this.tabId, this.tabLabel, this, this._tabOptions({ open: false, replace: false }));
    this._isShown = lm.hasTab(this.position, this.tabId);
    this._unbindToggle = lm.bindToggle(elementOrId, this.position, this.tabId);
    return this;
  }

  _bindDirectToggle(elementOrId) {
    const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return null;

    const syncActive = () => el.classList.toggle("Active", this.isVisible());
    const handler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggle();
      syncActive();
    };

    el.style.cursor = "pointer";
    el.addEventListener("click", handler);
    this._syncBoundToggleActive = syncActive;
    syncActive();
    return () => {
      el.removeEventListener("click", handler);
      this._syncBoundToggleActive = null;
    };
  }

  unbind() {
    this._unbindToggle?.();
    this._unbindToggle = null;
    this._syncBoundToggleActive = null;
    return this;
  }

  setLabel(label) {
    this.tabLabel = label;
    this.title = label;
    this.setTitle(label);
    if (this.layoutManager && this._isShown) {
      this.layoutManager.setTabLabel(this.position, this.tabId, label);
    }
    return this;
  }

  onTabSelected() {
    this.expand();
  }

  onTabDeselected() {}

  destroy() {
    this.unbind();
    this._unbindRegionDrag();
    if (this._detachedFloatingWindow) {
      const fp = this._detachedFloatingWindow;
      this._detachedFloatingWindow = null;
      fp._sourceWorkspacePanel = null;
      fp.dom?.parentNode?.removeChild(fp.dom);
    }
    this._floatHandlerCleanup?.();
    this._floatHandlerCleanup = null;
    this._signalCleanup?.();
    this._signalCleanup = null;
    this.hide();
  }
}
