/**
 * Shared default accessors for NavigationList and TreeView.
 * @param {Object} options
 * @returns {Object}
 * @category Utils
 */
export function createHierarchicalListOptions(options = {}) {
  return {
    onItemClick: options.onItemClick || null,
    renderItem: options.renderItem || null,
    getChildren: options.getChildren || ((item) => item.children || []),
    getLabel: options.getLabel || ((item) => item.name || item.label || "Item"),
    emptyMessage: options.emptyMessage || "No items",
  };
}
