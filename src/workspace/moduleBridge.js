/**
 * App-integration glue for wiring toolbar/menu controls to workspace tabs.
 *
 * @module workspace/moduleBridge
 */

const TOGGLE_NODE_TYPES = new Set([
  "RibbonButton",
  "ContextModules",
  "Tool",
  "Button",
  "Module",
]);

/**
 * Walk `context.config.ui.WorldComponent` for a node with `moduleId`.
 * @param {Object} context
 * @param {string} moduleId
 * @param {{ types?: Set<string> }} [options]
 * @returns {string|null} node `id`
 * @category Shell
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

/**
 * Find the DOM element id for a toolbar/menu node that activates a given module.
 * @param {Object} context
 * @param {string} moduleId
 * @returns {string|null}
 * @category Shell
 */
export function resolveModuleToggleId(context, moduleId) {
  return resolveWorldNodeId(context, moduleId, { types: TOGGLE_NODE_TYPES });
}

/**
 * Bind a DOM element to toggle a specific workspace tab.
 * @param {import('./WorkspaceLayout.js').WorkspaceLayout} layout
 * @param {string|HTMLElement} elementOrId
 * @param {'left'|'right'|'bottom'} position
 * @param {string} tabId
 * @returns {Function|null}
 * @category Shell
 */
export function bindToggle(layout, elementOrId, position, tabId) {
  const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
  if (!el) return null;

  const syncActive = () => {
    el.classList.toggle(
      "Active",
      layout.isWorkspaceOpen(position) && layout.isTabSelected(position, tabId),
    );
  };

  const handler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    layout.toggleTab(position, tabId);
    syncActive();
  };

  el.style.cursor = "pointer";
  el.addEventListener("click", handler);

  const signals = layout.context?.signals;
  const unsubs = [];
  const sub = (name) => {
    const sig = signals?.[name];
    if (!sig || typeof sig.add !== "function" || typeof sig.remove !== "function") return;
    sig.add(syncActive);
    unsubs.push(() => sig.remove(syncActive));
  };
  sub("layoutTabChanged");
  sub("layoutWorkspaceChanged");
  sub("layoutTabRemoved");
  sub("layoutTabAdded");
  syncActive();

  return () => {
    el.removeEventListener("click", handler);
    for (const u of unsubs) u();
  };
}

/**
 * Bind a toolbar control to a tab using `moduleId` or explicit `toggleElementId`.
 * @param {import('./WorkspaceLayout.js').WorkspaceLayout} layout
 * @param {string} moduleId
 * @param {'left'|'right'|'bottom'} position
 * @param {string} tabId
 * @param {{ toggleElementId?: string }} [options={}]
 * @returns {Function|null}
 * @category Shell
 */
export function bindToggleForModule(layout, moduleId, position, tabId, options = {}) {
  const elId =
    options?.toggleElementId ||
    (moduleId ? resolveModuleToggleId(layout.context, moduleId) : null);
  if (!elId) return null;
  return bindToggle(layout, elId, position, tabId);
}
