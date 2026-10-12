/**
 * Find a world-config node id by `moduleId`.
 * Panels use this to resolve a mount parent. It does not start the layout engine.
 *
 * @param {Object} context
 * @param {string} moduleId
 * @param {{ types?: Set<string> }} [options]
 * @returns {string|null}
 */
export function resolveWorldNodeId(context, moduleId, options = {}) {
  if (!moduleId || !context?.config?.ui?.WorldComponent) return null;

  const types = options.types || null;
  let found = null;

  const visit = (node) => {
    if (found || !node || typeof node !== "object") return;
    if (
      node.moduleId === moduleId &&
      node.id &&
      (!types || types.has(node.type))
    ) {
      found = node.id;
      return;
    }
    for (const child of node.children || []) visit(child);
  };

  visit(context.config.ui.WorldComponent);
  return found;
}
