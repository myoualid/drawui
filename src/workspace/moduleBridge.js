/**
 * Bind a DOM element the application owns to a workspace tab.
 * @param {import('./WorkspaceLayout.js').WorkspaceLayout} layout
 * @param {string|HTMLElement} elementOrId
 * @param {'left'|'right'|'bottom'} position
 * @param {string} tabId
 * @returns {Function|null} Unsubscribe. Removes the click listener and layout subscriptions.
 * @category Shell
 */
export function bindToggle(layout, elementOrId, position, tabId) {
  const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
  if (!el || !layout) return null;

  const syncActive = () => {
    el.classList.toggle(
      "Active",
      layout.isWorkspaceOpen(position) && layout.isTabSelected(position, tabId),
    );
  };

  const handler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    layout.toggleTab(position, tabId);
    syncActive();
  };

  el.style.cursor = "pointer";
  el.addEventListener("click", handler);

  const unsubs = ["tab:selected", "tab:added", "tab:removed", "workspace"]
    .map((eventName) => layout.on?.(eventName, syncActive))
    .filter((unsub) => typeof unsub === "function");

  syncActive();

  return () => {
    el.removeEventListener("click", handler);
    for (const unsub of unsubs) unsub();
  };
}
