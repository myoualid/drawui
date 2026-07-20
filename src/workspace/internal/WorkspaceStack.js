import { Container } from "../../primitives/ui.js";

/**
 * Mount point for docked panel roots inside a workspace region.
 * Owns order and presence only — no chrome, collapse, or component styling.
 *
 * @typedef {Object} WorkspaceStackOptions
 * @property {function(): void} [onLayoutChange]
 */

/**
 * @typedef {Object} WorkspacePanelEntry
 * @property {string} tabId
 * @property {string} ownerKey
 * @property {string} panelGroup
 * @property {HTMLElement} panelElement
 * @property {import('../../primitives/ui.js').Control|null} control
 * @property {string} label
 *
 * @category Shell
 */
class WorkspaceStack {
  /**
   * @param {HTMLElement} hostElement
   * @param {'left' | 'right' | 'bottom'} region
   * @param {WorkspaceStackOptions} [options]
   */
  constructor(hostElement, region, options = {}) {
    this.hostElement = hostElement;
    this.region = region;
    this.onLayoutChange = typeof options.onLayoutChange === "function"
      ? options.onLayoutChange
      : null;

    /** @type {WorkspacePanelEntry[]} */
    this.panelEntries = [];

    /** @type {string|null} */
    this.selectedTabId = null;

    this.stackRoot = new Container().addClass("WorkspaceStack");

    hostElement.innerHTML = "";
    hostElement.appendChild(this.stackRoot.dom);
  }

  /**
   * @param {string} tabId
   * @param {string} label
   * @param {HTMLElement|import('../../primitives/ui.js').Control} content
   * @param {{ ownerKey?: string, panelGroup?: string }} [meta]
   * @returns {WorkspacePanelEntry|null}
   */
  addPanel(tabId, label, content, meta = {}) {
    if (!tabId) return null;

    if (this.getEntry(tabId)) {
      this.removePanel(tabId);
    }

    const isControl = content && typeof content === "object" && content.dom instanceof HTMLElement;
    const panelElement = isControl
      ? content.dom
      : content instanceof HTMLElement
        ? content
        : null;

    if (!panelElement) return null;

    const entry = {
      tabId,
      label: label || tabId,
      ownerKey: meta.ownerKey || `anon:${tabId}`,
      panelGroup: meta.panelGroup || "default",
      panelElement,
      control: isControl ? content : null,
    };

    panelElement.dataset.workspaceTabId = tabId;
    panelElement.dataset.ownerKey = entry.ownerKey;

    this.stackRoot.dom.appendChild(panelElement);
    this.panelEntries.push(entry);
    this.selectedTabId = tabId;
    this._notifyLayoutChange();
    return entry;
  }

  /** @param {string} tabId @returns {boolean} */
  removePanel(tabId) {
    const index = this.panelEntries.findIndex((entry) => entry.tabId === tabId);
    if (index === -1) return false;

    const entry = this.panelEntries[index];
    delete entry.panelElement.dataset.workspaceTabId;
    if (entry.panelElement.parentNode === this.stackRoot.dom) {
      entry.panelElement.remove();
    }

    this.panelEntries.splice(index, 1);
    if (this.selectedTabId === tabId) {
      this.selectedTabId = this.panelEntries[this.panelEntries.length - 1]?.tabId ?? null;
    }

    this._notifyLayoutChange();
    return true;
  }

  /** @param {string} tabId @returns {WorkspacePanelEntry|null} */
  getEntry(tabId) {
    return this.panelEntries.find((entry) => entry.tabId === tabId) || null;
  }

  /** @param {string} tabId @returns {boolean} */
  hasPanel(tabId) {
    return Boolean(this.getEntry(tabId));
  }

  /** @returns {boolean} */
  hasAnyPanels() {
    return this.panelEntries.length > 0;
  }

  /** @param {string} tabId @returns {boolean} */
  selectPanel(tabId) {
    const entry = this.getEntry(tabId);
    if (!entry) return false;
    this.selectedTabId = tabId;
    return true;
  }

  /** @param {string} tabId @param {string} label */
  setPanelLabel(tabId, label) {
    const entry = this.getEntry(tabId);
    if (!entry) return false;
    entry.label = label;
    return true;
  }

  /**
   * @param {string} ownerKey
   * @returns {WorkspacePanelEntry[]}
   */
  extractPanelsByOwner(ownerKey) {
    const moved = this.panelEntries.filter((entry) => entry.ownerKey === ownerKey);
    for (const entry of moved) {
      entry.panelElement.remove();
    }
    this.panelEntries = this.panelEntries.filter((entry) => entry.ownerKey !== ownerKey);
    if (moved.some((entry) => entry.tabId === this.selectedTabId)) {
      this.selectedTabId = this.panelEntries[this.panelEntries.length - 1]?.tabId ?? null;
    }
    this._notifyLayoutChange();
    return moved;
  }

  /**
   * @param {string} tabId
   * @returns {WorkspacePanelEntry|null}
   */
  extractPanel(tabId) {
    const index = this.panelEntries.findIndex((entry) => entry.tabId === tabId);
    if (index === -1) return null;

    const entry = this.panelEntries[index];
    entry.panelElement.remove();
    this.panelEntries.splice(index, 1);
    if (this.selectedTabId === tabId) {
      this.selectedTabId = this.panelEntries[this.panelEntries.length - 1]?.tabId ?? null;
    }
    this._notifyLayoutChange();
    return entry;
  }

  /** @param {WorkspacePanelEntry} entry @returns {boolean} */
  adoptPanel(entry) {
    if (!entry?.panelElement) return false;

    this.stackRoot.dom.appendChild(entry.panelElement);
    this.panelEntries.push(entry);
    this.selectedTabId = entry.tabId;
    this._notifyLayoutChange();
    return true;
  }

  /** @private */
  _notifyLayoutChange() {
    this.onLayoutChange?.();
  }
}

export { WorkspaceStack };
