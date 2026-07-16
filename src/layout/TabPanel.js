import { UIDiv, UIRow } from "../primitives/ui.js";

import { FloatingPanel } from "../overlays/FloatingPanel.js";

import { buildWorkspaceDockHandlers, resolveFloatingMountElement } from "../utils/workspace-panel-dock.js";

import { PanelHeader } from "./PanelHeader.js";
import { PanelFooter } from "./PanelFooter.js";

/**
 * @typedef {'left' | 'right' | 'bottom'} LayoutPosition
 * Position of the tab panel in the layout.
 */

/**
 * @typedef {Object} TabPanelOptions
 * @property {Object} context - Application context (`context.ui.model.layoutManager`).
 * @property {Object} [operators] - Integration with operators.
 * @property {LayoutPosition} [position='right'] - Layout position: 'left', 'right', or 'bottom'.
 * @property {string} tabId - Unique identifier for the tab.
 * @property {string} tabLabel - Display label shown in the tab header.
 * @property {string} [icon] - Material icon name for the header.
 * @property {string} [title] - Panel title displayed in the header.
 * @property {Object} [panelStyles={}] - Inline styles applied to the tab page root when the tab is added (`this.panel`, same element as tab id).
 * @property {boolean} [showHeader=true] - Whether to display the panel header.
 * @property {boolean} [autoShow=false] - Whether to show the tab automatically on creation.
 * @property {string} [moduleId] - If set with layoutManager, registers the tab and binds `bindToggle` using UI config.
 * @property {string} [ownerId] - Explicit workspace stack segment owner (independent of moduleId grouping).
 * @property {string} [toggleElementId] - Explicit toolbar/control DOM id (overrides moduleId resolution).
 * @property {string} [panelGroup='default'] - Tabbed panel group within a module stack segment.
 * @property {boolean} [floatable=false] - Show undock on the workspace tab label (needs layoutManager).
 * @property {boolean} [startFloating=false] - Show as a floating panel first instead of inserting into the workspace.
 * @property {Object} [floatingStyles] - Inline styles applied to the floating panel window.
 * @property {boolean} [floatingClosable=true] - Whether the floating window has a close button.
 */

/**
 * TabPanel - A panel component that integrates with the LayoutManager's tabbed panels.
 * 
 * Unlike legacy viewport panels, TabPanel registers itself
 * as a tab in the left, right, or bottom layout panels managed by LayoutManager.
 * 
 * @example
 * // Create a settings panel in the right tab area
 * const settingsPanel = new TabPanel({
 *   context,
 *   operators,
 *   position: 'right',
 *   tabId: 'settings',
 *   tabLabel: 'Settings',
 *   icon: 'settings',
 *   title: 'Application Settings'
 * });
 * 
 * // Add content to the panel
 * settingsPanel.content.add(DrawUI.text('Settings content here'));
 * 
 * // Show the panel (adds tab and opens panel)
 * settingsPanel.show();
 * 
 * // Toggle visibility
 * settingsPanel.toggle();
 * 
 * // Hide the panel (removes tab)
 * settingsPanel.hide();
 * 
 * @example
 * // Bind a button to toggle the panel
 * settingsPanel.bindTo('SettingsButton');
 */
export class TabPanel {
  /**
   * Create a new TabPanel.
   * 
   * @param {TabPanelOptions} options - Configuration options.
   */
  constructor(options = {}) {
    const {
      context,
      operators,
      position = 'right',
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
      panelGroup = 'default',
      floatable = false,
      startFloating = false,
      floatingStyles = null,
      floatingClosable = true,
    } = options;

    if (!tabId) {
      throw new Error('TabPanel requires a tabId');
    }

    if (!tabLabel) {
      throw new Error('TabPanel requires a tabLabel');
    }

    /** @type {Object} Application context */
    this.context = context;

    /** @type {Object} Operators reference */
    this.operators = operators;

    /** @type {LayoutPosition} Panel position in layout */
    this.position = position;

    /** @type {string} Unique tab identifier */
    this.tabId = tabId;

    /** @type {string} Tab display label */
    this.tabLabel = tabLabel;

    /** @type {string|undefined} Header icon */
    this.icon = icon;

    /** @type {string|undefined} Header title */
    this.title = title || tabLabel;

    /** @type {string|null} Module id used to resolve a ribbon/menu toggle. */
    this.moduleId = moduleId || null;

    /** @type {string|null} Explicit workspace segment owner id. */
    this.ownerId = ownerId || null;

    /** @type {string} Tabbed panel group within a module stack segment. */
    this.panelGroup = panelGroup || 'default';

    /** @type {string|null} Explicit toggle element id. */
    this.toggleElementId = toggleElementId || this.resolveToggleElementId(context, moduleId);

    /** @type {boolean} Whether panel is currently shown as a tab */
    this._isShown = false;

    /** @type {Function|null} Cleanup function for bound toggles */
    this._unbindToggle = null;

    /** @type {Function|null} Sync Active class for direct parent bindings. */
    this._syncBoundToggleActive = null;

    /** @type {Function|null} Signal subscription cleanup */
    this._signalCleanup = null;

    /** @type {Function|null} */
    this._floatHandlerCleanup = null;

    /** @type {object|null} */
    this._detachedFloatingPanel = null;

    /** @type {{ left: string, top: string, width: string, height: string }|null} */
    this._savedFloatGeometry = null;

    /** @type {boolean} */
    this._floatable = floatable;

    /** @type {boolean} */
    this._startFloating = startFloating;

    /** @type {Object} */
    this.floatingStyles = floatingStyles || {};

    /** @type {boolean} */
    this._floatingClosable = floatingClosable;

    /** @type {Object} */
    this.panelStyles = panelStyles;

    this.panel = new UIDiv();
    this.panel.addClass('TabPanel');

    this.header = new UIDiv();
    this.header.addClass('TabPanelHeader');

    if (showHeader) {
      this._buildHeader();
      this.panel.add(this.header);
    }

    this.content = new UIDiv();
    this.content.addClass('PanelContent');
    this.panel.add(this.content);

    this.footer = new UIRow();
    this.footer.addClass('TabPanelFooter');
    this.panel.add(this.footer);

    this._subscribeToSignals();

    const layoutManagerForFloat = this.layoutManager;
    if (floatable && !startFloating && layoutManagerForFloat) {
      this._floatHandlerCleanup = layoutManagerForFloat.registerTabFloatHandler(
        this.position,
        this.tabId,
        () => this.detachToFloatingWindow(),
      );
    }

    if (this.toggleElementId) {
      this.bindTo(this.toggleElementId);
    }

    if (autoShow) {
      this.show();
    }
  }

  /**
   * Get the LayoutManager instance from context.
   * @returns {Object|null} The LayoutManager or null if not available.
   * @private
   */
  get layoutManager() {
    return this.context.ui.model.layoutManager || null;
  }

  resolveToggleElementId(context, moduleId) {
    if (!moduleId) return null;

    const root = context?.config?.ui?.WorldComponent;

    const find = (node) => {
      if (!node || typeof node !== 'object') return null;

      if (node.moduleId === moduleId && node.id) return node.id;

      const children = Array.isArray(node.children) ? node.children : [];

      for (const child of children) {
        const found = find(child);

        if (found) return found;
      }

      return null;
    };

    return find(root);
  }

  _syncToggleActive() {
    if (typeof this._syncBoundToggleActive === 'function') {
      this._syncBoundToggleActive();
    }
  }

  /**
   * Build the header content with icon and title.
   * @private
   */
  _buildHeader() {
    this.panelHeader = new PanelHeader({
      title: this.title,
      icon: this.icon,
      alwaysActionsColumn: true,
    });
    this.header.add(this.panelHeader);
  }

  /**
   * Subscribe to LayoutManager signals for lifecycle hooks.
   * @private
   */
  _subscribeToSignals() {
    const ctx = this.context;
    const signals = ctx && ctx.signals;
    if (!signals) return;

    const unsubs = [];

    const onTabChanged = (payload) => {
      if (payload.position === this.position && payload.id === this.tabId) {
        this.onTabSelected();
      } else if (payload.position === this.position && this._isShown) {
        this.onTabDeselected();
      }
    };

    const onTabRemoved = (payload) => {
      if (payload.position === this.position && payload.id === this.tabId) {
        this._isShown = false;
        this.onHide();
      }
    };

    const sub = (name, handler) => {
      const sig = signals[name];
      if (sig && typeof sig.add === 'function') {
        sig.add(handler);
        unsubs.push(() => {
          if (sig && typeof sig.remove === 'function') {
            sig.remove(handler);
          }
        });
      }
    };

    sub('layoutTabChanged', onTabChanged);
    sub('layoutTabRemoved', onTabRemoved);

    this._signalCleanup = () => {
      for (const u of unsubs) u();
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Show the panel by adding it as a tab to the layout.
   * Opens the panel and selects the tab.
   * 
   * @param {Object} [options={}] - Show options.
   * @param {boolean} [options.select=true] - Whether to select the tab after adding.
   * @returns {TabPanel} This instance for chaining.
   * 
   * @example
   * panel.show(); // Add tab and open panel
   * panel.show({ select: false }); // Add tab but don't select it
   */
  show(options = {}) {
    const { select = true, open = select } = options;
    const lm = this.layoutManager;
    if (!lm && !this._startFloating) {
      console.warn('TabPanel: LayoutManager not available');
      return this;
    }

    if (this._detachedFloatingPanel) {
      const mountEl = resolveFloatingMountElement(lm);
      if (this._detachedFloatingPanel.isClosed || !this._detachedFloatingPanel.dom.parentElement) {
        this._detachedFloatingPanel.mountFloating(mountEl);
      } else {
        this._detachedFloatingPanel.restore();
      }
      this.onShow();
      this._syncToggleActive();
      return this;
    }

    if (this._startFloating && !(lm && lm.hasTab(this.position, this.tabId))) {
      this.detachToFloatingWindow({ removeTab: false, callHide: false });
      this.onShow();
      this._syncToggleActive();
      return this;
    }

    if (lm.hasTab(this.position, this.tabId)) {
      this._isShown = true;
      if (select) {
        lm.selectTab(this.position, this.tabId);
      }
      this.onShow();
      this._syncToggleActive();
      return this;
    }

    lm.addTab(this.position, this.tabId, this.tabLabel, this.panel, {
      open,
      replace: true,
      floatable: this._floatable,
      panelStyles: this.panelStyles,
      moduleId: this.moduleId,
      ownerId: this.ownerId,
      panelGroup: this.panelGroup,
    });
    
    if (select) {
      lm.selectTab(this.position, this.tabId);
    }

    this._isShown = true;
    this.onShow();
    this._syncToggleActive();
    return this;
  }

  /**
   * Hide the panel by removing its tab from the layout.
   * 
   * @param {Object} [options={}] - Hide options.
   * @param {boolean} [options.closeIfEmpty=false] - Close the panel if no tabs remain.
   * @returns {TabPanel} This instance for chaining.
   * 
   * @example
   * panel.hide(); // Remove tab
   * panel.hide({ closeIfEmpty: true }); // Remove tab and close panel if empty
   */
  hide(options = {}) {
    const { closeIfEmpty = false } = options;
    const lm = this.layoutManager;

    if (this._detachedFloatingPanel) {
      this._detachedFloatingPanel.hide();
      this.onHide();
      this._syncToggleActive();
      return this;
    }

    if (!lm) return this;

    lm.removeTab(this.position, this.tabId, { closeIfEmpty });
    this._isShown = false;
    this.onHide();
    this._syncToggleActive();
    return this;
  }

  /**
   * Toggle the panel visibility.
   * If shown and selected, closes the panel. Otherwise, shows and selects it.
   * 
   * @returns {TabPanel} This instance for chaining.
   * 
   * @example
   * toggleButton.onClick(() => panel.toggle());
   */
  /**
   * Remove this tab from the workspace and show the same content in a FloatingPanel (round-trip with dock buttons).
   * @returns {FloatingPanel|null}
   */
  detachToFloatingWindow(options = {}) {
    const { removeTab = true, callHide = true } = options;
    const lm = this.layoutManager;

    if (this._detachedFloatingPanel) {
      const mountEl = resolveFloatingMountElement(lm);
      this._detachedFloatingPanel.mountFloating(mountEl);
      return this._detachedFloatingPanel;
    }

    if (this._floatHandlerCleanup) {
      this._floatHandlerCleanup();
      this._floatHandlerCleanup = null;
    }

    const fp = new FloatingPanel({
      title: this.title,
      icon: this.icon,
      closable: this._floatingClosable,
      sourceTabPanel: this,
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

    if (this.floatingStyles && typeof this.floatingStyles === 'object') {
      fp.setStyles(this.floatingStyles);
    }

    if (removeTab && lm) {
      lm.removeTab(this.position, this.tabId, { closeIfEmpty: true });
      this._isShown = false;
      if (callHide) {
        this.onHide();
      }
    }

    fp.content.appendChild(this.panel.dom);

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
    this._detachedFloatingPanel = fp;
    return fp;
  }

  restoreContentFromFloatingPanel(floatingPanel, layoutManager, position, tabId, tabLabel) {
    const lm = layoutManager;
    if (!lm || !floatingPanel) {
      return;
    }
    const floatContent = floatingPanel.content;
    if (!floatContent) {
      return;
    }
    this._detachedFloatingPanel = null;
    this.position = position;
    if (this._floatHandlerCleanup) {
      this._floatHandlerCleanup();
      this._floatHandlerCleanup = null;
    }
    if (this.panel.dom && floatContent.contains(this.panel.dom)) {
      floatContent.removeChild(this.panel.dom);
    } else {
      while (floatContent.firstChild) {
        this.content.dom.appendChild(floatContent.firstChild);
      }
    }
    const label = tabLabel != null && tabLabel !== '' ? tabLabel : this.tabLabel;
    lm.addTab(position, tabId, label, this.panel, {
      open: true,
      replace: true,
      floatable: this._floatable,
      panelStyles: this.panelStyles,
      moduleId: this.moduleId,
      ownerId: this.ownerId,
      panelGroup: this.panelGroup,
    });
    lm.selectTab(position, tabId, { open: true });
    this._isShown = true;
    this.onShow();
    this._floatHandlerCleanup = lm.registerTabFloatHandler(
      position,
      tabId,
      () => this.detachToFloatingWindow(),
    );
    floatingPanel._sourceTabPanel = null;
    const fpDom = floatingPanel.dom;
    if (fpDom) {
      const { left, top, width, height } = fpDom.style;
      if (left || top) this._savedFloatGeometry = { left, top, width, height };
      if (fpDom.parentNode) fpDom.parentNode.removeChild(fpDom);
    }
  }

  toggle() {
    const lm = this.layoutManager;

    if (this._detachedFloatingPanel) {
      const isVisible = this._detachedFloatingPanel.dom.style.display !== 'none'
        && Boolean(this._detachedFloatingPanel.dom.parentElement)
        && !this._detachedFloatingPanel.isClosed;

      if (isVisible) {
        this.hide();
      } else {
        this.show();
      }
      return this;
    }

    if (!lm) return this;

    if (this._isShown) {
      // Check if we should close or just add (if not shown yet in this session)
      const isOpen = lm.isWorkspaceOpen(this.position);
      const isSelected = lm.isTabSelected(this.position, this.tabId);
      
      if (isOpen && isSelected) {
        lm.closeWorkspace(this.position);
      } else {
        lm.selectTab(this.position, this.tabId, { open: true });
      }
    } else {
      this.show();
    }
    return this;
  }

  /**
   * Select this tab without hiding other tabs.
   * Opens the panel if closed.
   * 
   * @returns {TabPanel} This instance for chaining.
   */
  select() {
    const lm = this.layoutManager;
    if (this._detachedFloatingPanel) {
      return this.show();
    }

    if (!lm) return this;

    if (!this._isShown) {
      this.show();
    } else {
      lm.selectTab(this.position, this.tabId, { open: true });
    }
    return this;
  }

  /**
   * Check if this tab is currently visible (shown in the layout).
   * 
   * @returns {boolean} True if the tab exists in the layout.
   */
  isVisible() {
    if (this._detachedFloatingPanel) {
      return this._detachedFloatingPanel.dom.style.display !== 'none'
        && Boolean(this._detachedFloatingPanel.dom.parentElement)
        && !this._detachedFloatingPanel.isClosed;
    }

    return this._isShown;
  }

  /**
   * Check whether the content is currently hosted by a floating panel.
   *
   * @returns {boolean}
   */
  isFloating() {
    return Boolean(this._detachedFloatingPanel);
  }

  /**
   * Return the current FloatingPanel host, if detached/floating.
   *
   * @returns {FloatingPanel|null}
   */
  getFloatingPanel() {
    return this._detachedFloatingPanel;
  }

  /**
   * Apply styles to the floating host. If not floating yet, stores them for first mount.
   *
   * @param {Object} styles - CSS property map.
   * @returns {TabPanel}
   */
  setFloatingStyles(styles = {}) {
    this.floatingStyles = styles || {};
    if (this._detachedFloatingPanel && this.floatingStyles && typeof this.floatingStyles === 'object') {
      this._detachedFloatingPanel.setStyles(this.floatingStyles);
    }
    return this;
  }

  /**
   * Check if this tab is currently selected (active).
   * 
   * @returns {boolean} True if the tab is selected.
   */
  isSelected() {
    const lm = this.layoutManager;
    if (!lm) return false;
    return lm.isTabSelected(this.position, this.tabId);
  }

  /**
   * Bind a DOM element to toggle this panel.
   * Creates bidirectional binding: click toggles panel, Active class syncs with state.
   * 
   * @param {string|HTMLElement} elementOrId - Element or its ID to bind.
   * @returns {TabPanel} This instance for chaining.
   * 
   * @example
   * panel.bindTo('SettingsButton');
   * 
   * @example
   * const btn = document.getElementById('my-btn');
   * panel.bindTo(btn);
   */
  bindTo(elementOrId) {
    if (this._unbindToggle) {
      this._unbindToggle();
      this._unbindToggle = null;
    }

    const lm = this.layoutManager;
    if (this._startFloating || !lm) {
      this._unbindToggle = this._bindDirectToggle(elementOrId);
      return this;
    }

    lm.ensureTab(this.position, this.tabId, this.tabLabel, this.panel, {
      open: false,
      replace: false,
      floatable: this._floatable,
      panelStyles: this.panelStyles,
      moduleId: this.moduleId,
      ownerId: this.ownerId,
      panelGroup: this.panelGroup,
    });
    this._isShown = lm.hasTab(this.position, this.tabId);

    this._unbindToggle = lm.bindToggle(elementOrId, this.position, this.tabId);
    return this;
  }

  _bindDirectToggle(elementOrId) {
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return null;

    const syncActive = () => {
      el.classList.toggle('Active', this.isVisible());
    };

    const handler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggle();
      syncActive();
    };

    el.style.cursor = 'pointer';
    el.addEventListener('click', handler);
    this._syncBoundToggleActive = syncActive;
    syncActive();

    return () => {
      el.removeEventListener('click', handler);
      this._syncBoundToggleActive = null;
    };
  }

  /**
   * Unbind any previously bound toggle element.
   * 
   * @returns {TabPanel} This instance for chaining.
   */
  unbind() {
    if (this._unbindToggle) {
      this._unbindToggle();
      this._unbindToggle = null;
    }
    this._syncBoundToggleActive = null;
    return this;
  }

  /**
   * Update the tab label.
   * 
   * @param {string} label - New label text.
   * @returns {TabPanel} This instance for chaining.
   * 
   * @example
   * panel.setLabel(`Items (${count})`);
   */
  setLabel(label) {
    this.tabLabel = label;
    const lm = this.layoutManager;
    if (lm && this._isShown) {
      lm.setTabLabel(this.position, this.tabId, label);
    }
    return this;
  }

  /**
   * Clear the content area.
   * 
   * @returns {TabPanel} This instance for chaining.
   */
  clearContent() {
    this.content.clear();
    return this;
  }

  /**
   * Set new content, replacing existing content.
   * 
   * @param {HTMLElement|{dom: HTMLElement}} content - New content element.
   * @returns {TabPanel} This instance for chaining.
   */
  setContent(content) {
    this.content.clear();
    this.content.add(content);
    return this;
  }

  /**
   * Add content to the panel without clearing existing content.
   * 
   * @param {HTMLElement|{dom: HTMLElement}} content - Content to add.
   * @returns {TabPanel} This instance for chaining.
   */
  addContent(content) {
    this.content.add(content);
    return this;
  }

  /**
   * Add an action element to the header.
   * 
   * @param {HTMLElement|{dom: HTMLElement}} action - Action element (button, icon, etc.)
   * @returns {TabPanel} This instance for chaining.
   */
  addHeaderAction(action) {
    this.panelHeader?.addAction(action);
    return this;
  }

  /**
   * Set footer content.
   * 
   * @param {Array<HTMLElement|{dom: HTMLElement}>} elements - Footer elements.
   * @param {string} [justify='flex-end'] - CSS justify-content value.
   * @returns {TabPanel} This instance for chaining.
   */
  setFooter(elements = [], justify = 'flex-end') {
    this.footer.clear();
    this.footer.add(new PanelFooter(elements, justify));
    return this;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIFECYCLE HOOKS (Override in subclasses)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Called when the panel is shown (tab added to layout).
   * Override in subclasses to handle show events.
   */
  onShow() {
    // Override in subclass
  }

  /**
   * Called when the panel is hidden (tab removed from layout).
   * Override in subclasses to handle hide events.
   */
  onHide() {
    // Override in subclass
  }

  /**
   * Called when this tab becomes selected (active).
   * Override in subclasses to handle selection events.
   */
  onTabSelected() {
    // Override in subclass
  }

  /**
   * Called when another tab is selected (this tab becomes inactive).
   * Override in subclasses to handle deselection events.
   */
  onTabDeselected() {
    // Override in subclass
  }

  /**
   * Clean up resources and remove the panel.
   */
  destroy() {
    this.unbind();
    if (this._detachedFloatingPanel) {
      const fp = this._detachedFloatingPanel;
      this._detachedFloatingPanel = null;
      fp._sourceTabPanel = null;
      if (fp.dom && fp.dom.parentNode) {
        fp.dom.parentNode.removeChild(fp.dom);
      }
    }
    if (this._floatHandlerCleanup) {
      this._floatHandlerCleanup();
      this._floatHandlerCleanup = null;
    }
    if (this._signalCleanup) {
      this._signalCleanup();
      this._signalCleanup = null;
    }
    this.hide();
  }
}

export default TabPanel;
