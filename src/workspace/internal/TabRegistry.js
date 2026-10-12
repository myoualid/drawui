/**
 * Group key for panels that move between regions together.
 * @param {{ group?: string, tabId?: string }} options
 * @returns {string}
 * @category Shell
 */
export function resolveOwnerKey({ group, tabId } = {}) {
  if (typeof group === "string" && group.length > 0) {
    return group;
  }

  if (typeof tabId === "string" && tabId.length > 0) {
    return tabId;
  }

  return "unknown";
}

/**
 * @typedef {Object} TabRecord
 * @property {string} tabId
 * @property {'left' | 'right' | 'bottom'} region
 * @property {string} ownerKey
 * @property {string} panelGroup
 * @property {HTMLElement|null} panelElement
 * @property {import('../../primitives/ui.js').Control|null} control
 */
class TabRegistry {
  constructor() {
    /** @type {Map<string, TabRecord>} */
    this.tabRecords = new Map();
  }

  /** @param {TabRecord} record */
  register(record) {
    if (record?.tabId) {
      this.tabRecords.set(record.tabId, record);
    }
  }

  /** @param {string} tabId */
  unregister(tabId) {
    if (tabId) {
      this.tabRecords.delete(tabId);
    }
  }

  /** @param {string} tabId @returns {TabRecord|null} */
  get(tabId) {
    return tabId ? this.tabRecords.get(tabId) || null : null;
  }

  /**
   * @param {'left' | 'right' | 'bottom'} region
   * @param {{ ownerKey?: string, panelGroup?: string }} [filter={}]
   * @returns {string[]}
   */
  getTabIds(region, filter = {}) {
    const tabIds = [];

    for (const record of this.tabRecords.values()) {
      if (record.region !== region) {
        continue;
      }

      if (filter.ownerKey && record.ownerKey !== filter.ownerKey) {
        continue;
      }

      if (filter.panelGroup && record.panelGroup !== filter.panelGroup) {
        continue;
      }

      tabIds.push(record.tabId);
    }

    return tabIds;
  }
}

export { TabRegistry };
