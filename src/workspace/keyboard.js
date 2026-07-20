/**
 * Global keyboard shortcuts for a WorkspaceLayout instance.
 *
 * @module workspace/keyboard
 */

/**
 * @typedef {Object} WorkspaceShortcut
 * @property {'left'|'right'|'bottom'} position - Workspace to toggle.
 * @property {(e: KeyboardEvent) => boolean} match - Predicate that returns true when the event should fire.
 */

/**
 * Default keyboard shortcuts:
 *   - Ctrl+B         → toggle left
 *   - Ctrl+Alt+B     → toggle right
 *   - Ctrl+J         → toggle bottom
 *
 * @type {WorkspaceShortcut[]}
 * @category Shell
 */
export const DEFAULT_WORKSPACE_SHORTCUTS = [
  {
    position: 'right',
    match: (e) => e.ctrlKey && e.altKey && (e.key === 'b' || e.key === 'B'),
  },
  {
    position: 'left',
    match: (e) => e.ctrlKey && !e.altKey && (e.key === 'b' || e.key === 'B'),
  },
  {
    position: 'bottom',
    match: (e) => e.ctrlKey && (e.key === 'j' || e.key === 'J'),
  },
];

/**
 * Install keyboard shortcuts that toggle workspace panels. Returns a cleanup
 * function that removes the listener.
 *
 * @param {import('./WorkspaceLayout.js').WorkspaceLayout} layout
 * @param {{ shortcuts?: WorkspaceShortcut[] }} [options]
 * @returns {() => void}
 * @category Shell
 */
export function installWorkspaceShortcuts(layout, options = {}) {
  const shortcuts = Array.isArray(options.shortcuts) && options.shortcuts.length > 0
    ? options.shortcuts
    : DEFAULT_WORKSPACE_SHORTCUTS;

  const onKeyDown = (e) => {
    for (const shortcut of shortcuts) {
      if (!shortcut || typeof shortcut.match !== 'function') continue;
      if (shortcut.match(e)) {
        e.preventDefault();
        layout.toggleWorkspace(shortcut.position);
        return;
      }
    }
  };

  document.addEventListener('keydown', onKeyDown);

  return function uninstallWorkspaceShortcuts() {
    document.removeEventListener('keydown', onKeyDown);
  };
}
