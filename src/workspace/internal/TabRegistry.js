/**
 * @param {{ moduleId?: string, ownerId?: string, tabId?: string }} options
 * @returns {string}
 * @category Shell
 */
export function resolveOwnerKey({ moduleId, ownerId, tabId }) {
  if (typeof moduleId === "string" && moduleId.length > 0) {
    return `module:${moduleId}`;
  }

  if (typeof ownerId === "string" && ownerId.length > 0) {
    return `owner:${ownerId}`;
  }

  if (typeof tabId === "string" && tabId.length > 0) {
    return `anon:${tabId}`;
  }

  return "anon:unknown";
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
