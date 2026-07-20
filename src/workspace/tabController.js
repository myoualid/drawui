import { resolveOwnerKey } from "./internal/TabRegistry.js";

/**
 * Panel registry CRUD for a {@link WorkspaceLayout}: mount/unmount panel roots
 * in region stacks. Does not create or style components.
 *
 * @category Shell
 */
class WorkspaceTabController {
  /**
   * @param {import('./WorkspaceLayout.js').WorkspaceLayout} layout
   */
  constructor(layout) {
    /** @type {import('./WorkspaceLayout.js').WorkspaceLayout} */
    this.layout = layout;

    /** @type {Map<string, function(): void>} */
    this._tabFloatHandlers = new Map();
  }

  addTab(position, id, label, content, options = {}) {
    const {
      open = true,
      replace = true,
      moduleId,
      panelGroup = "default",
      ownerId,
    } = options;

    const layout = this.layout;
    const stack = layout.workspaceStacks[position];
    if (!stack) return false;

    if (replace || stack.hasPanel(id)) {
      const existingRecord = layout.tabRegistry.get(id);
      if (existingRecord) {
        layout.workspaceStacks[existingRecord.region]?.removePanel(id);
        layout.tabRegistry.unregister(id);
      } else {
        stack.removePanel(id);
      }
    }

    const ownerKey = resolveOwnerKey({ moduleId, ownerId, tabId: id });
    const resolvedPanelGroup = panelGroup || "default";
    const entry = stack.addPanel(id, label, content, {
      ownerKey,
      panelGroup: resolvedPanelGroup,
    });
    if (!entry) return false;

    layout.tabRegistry.register({
      tabId: id,
      region: position,
      ownerKey,
      panelGroup: resolvedPanelGroup,
      panelElement: entry.panelElement,
      control: entry.control,
    });
    layout._emit("layoutTabAdded", {
      position,
      id,
      ownerKey,
      panelGroup: resolvedPanelGroup,
    });

    if (open) layout.openWorkspace(position);
    return true;
  }

  ensureTab(position, id, label, content, options = {}) {
    const {
      open = false,
      replace = false,
      floatable = false,
      panelStyles,
      moduleId,
      panelGroup,
      ownerId,
    } = options;
    if (this.hasTab(position, id)) return true;
    return this.addTab(position, id, label, content, {
      open,
      replace,
      floatable,
      panelStyles,
      moduleId,
      panelGroup,
      ownerId,
    });
  }

  removeTab(position, id, options = {}) {
    const { closeIfEmpty = false } = options;
    const layout = this.layout;
    const record = layout.tabRegistry.get(id);
    const stack = layout.workspaceStacks[position];
    if (!stack || !stack.hasPanel(id)) return false;

    stack.removePanel(id);
    layout.tabRegistry.unregister(id);
    layout._emit("layoutTabRemoved", {
      position,
      id,
      ownerKey: record?.ownerKey || null,
    });

    if (closeIfEmpty && !stack.hasAnyPanels()) {
      layout.closeWorkspace(position);
    }

    return true;
  }

  selectTab(position, id, options = {}) {
    const { open = true } = options;
    const layout = this.layout;
    const stack = layout.workspaceStacks[position];
    if (!stack?.selectPanel(id)) return false;

    const record = layout.tabRegistry.get(id);
    layout._emit("layoutTabChanged", {
      position,
      id,
      ownerKey: record?.ownerKey || null,
      panelGroup: record?.panelGroup || null,
    });
    if (open) layout.openWorkspace(position);
    return true;
  }

  toggleTab(position, id) {
    const layout = this.layout;
    const isOpen = layout.isWorkspaceOpen(position);
    const isSelected = this.isTabSelected(position, id);
    if (isOpen && isSelected) {
      layout.closeWorkspace(position);
      return true;
    }
    this.selectTab(position, id, { open: true });
    return true;
  }

  hasTab(position, id) {
    const record = this.layout.tabRegistry.get(id);
    return Boolean(record && record.region === position);
  }

  getTabIds(position, filter = {}) {
    return this.layout.tabRegistry.getTabIds(position, filter);
  }

  getSelectedTabId(position) {
    return this.layout.workspaceStacks[position]?.selectedTabId ?? null;
  }

  isTabSelected(position, id) {
    return this.getSelectedTabId(position) === id;
  }

  clearTabs(position, closeWorkspace = true) {
    const ids = this.getTabIds(position);
    if (ids.length === 0) {
      return false;
    }

    for (const id of ids) {
      this.removeTab(position, id);
    }

    if (closeWorkspace) this.layout.closeWorkspace(position);
    return true;
  }

  setTabLabel(position, id, label) {
    const stack = this.layout.workspaceStacks[position];
    if (!stack) return false;
    return stack.setPanelLabel(id, label);
  }

  /**
   * Register handler for when the user undocks a workspace panel.
   * @param {'left'|'right'|'bottom'} position
   * @param {string} tabId
   * @param {function(): void} fn
   * @returns {function(): void} cleanup
   */
  registerTabFloatHandler(position, tabId, fn) {
    const key = `${position}:${tabId}`;
    this._tabFloatHandlers.set(key, fn);
    return () => {
      if (this._tabFloatHandlers.get(key) === fn) this._tabFloatHandlers.delete(key);
    };
  }

  /**
   * @param {'left'|'right'|'bottom'} position
   * @param {string} tabId
   */
  invokeTabFloat(position, tabId) {
    const fn = this._tabFloatHandlers.get(`${position}:${tabId}`);
    if (typeof fn === "function") fn();
  }

  /**
   * @param {'left'|'right'|'bottom'} position
   * @param {string} tabId
   * @returns {(() => void) | null}
   */
  getTabFloatHandler(position, tabId) {
    return this._tabFloatHandlers.get(`${position}:${tabId}`) || null;
  }

  /**
   * Re-key tab-float handlers when a panel is moved between workspaces.
   * @param {'left'|'right'|'bottom'} fromPosition
   * @param {'left'|'right'|'bottom'} toPosition
   * @param {string} tabId
   */
  rekeyTabFloatHandler(fromPosition, toPosition, tabId) {
    const oldHandlerKey = `${fromPosition}:${tabId}`;
    const floatHandler = this._tabFloatHandlers.get(oldHandlerKey);
    if (floatHandler) {
      this._tabFloatHandlers.delete(oldHandlerKey);
      this._tabFloatHandlers.set(`${toPosition}:${tabId}`, floatHandler);
    }
  }
}

export { WorkspaceTabController };
