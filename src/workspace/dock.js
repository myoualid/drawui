import { Container } from "../primitives/ui.js";


/** @type {WeakMap<HTMLElement, { fp: import('../overlays/FloatingWindow.js').FloatingWindow, lm: object, position: string, tabId: string, scrollAreaEl: HTMLElement, cleanupFloat?: () => void }>} */
const workspaceDockMeta = new WeakMap();

/**
 * Resolve the DOM element that floating panels should be appended to.
 * @param {object} lm - WorkspaceLayout instance
 * @returns {HTMLElement|null}
 * @category Shell
 */
export function resolveFloatingMountElement(lm) {
  if (lm && typeof lm.getFloatingWindowMountElement === 'function') {
    const mountEl = lm.getFloatingWindowMountElement();
    if (mountEl instanceof HTMLElement && mountEl.isConnected) return mountEl;
  }
  if (typeof document !== 'undefined') {
    return document.getElementById('World') || document.body;
  }
  return null;
}

/**
 * @param {{ layoutManager: object, tabId: string, tabLabel?: string }} opts
 * @returns {{ left?: Function, bottom?: Function, right?: Function }|undefined}
 *
 * @example <caption>Note</caption>
 * // live
 * return new Disclaimer(
 *   "buildWorkspaceDockHandlers({ layoutManager, tabId, tabLabel }) wires WorkspacePanel dock chrome.",
 * );
 *
 * @category Shell
 */
export function buildWorkspaceDockHandlers({ layoutManager: lm, tabId, tabLabel }) {
  if (!lm || !tabId) return undefined;
  return {
    left: (fp) => dockFloatingWindowToWorkspace(fp, lm, "left", tabId, tabLabel),
    bottom: (fp) => dockFloatingWindowToWorkspace(fp, lm, "bottom", tabId, tabLabel),
    right: (fp) => dockFloatingWindowToWorkspace(fp, lm, "right", tabId, tabLabel),
  };
}

/**
 * Move floating panel body into a docked WorkspacePanel / stack slot. Undock uses the
 * WorkspacePanel header float control (registerTabFloatHandler).
 * @param {import('../overlays/FloatingWindow.js').FloatingWindow} fp
 * @param {{ addTab: Function, removeTab: Function, selectTab?: Function, registerTabFloatHandler?: Function }} lm
 * @param {'left'|'right'|'bottom'} position
 * @param {string} tabId
 * @param {string} [tabLabel]
 * @category Shell
 */
function dockFloatingWindowToWorkspace(fp, lm, position, tabId, tabLabel) {
  if (fp._sourceWorkspacePanel) {
    return fp._sourceWorkspacePanel.restoreContentFromFloatingWindow(fp, lm, position, tabId, tabLabel);
  }

  let fromTitle = "";
  const title = fp.title;
  if (title && title.text && title.text.dom) {
    const textNode = title.text.dom.textContent;
    if (textNode) fromTitle = textNode;
  }
  const label = tabLabel || fromTitle || tabId;
  const contentEl = fp.content;
  if (!contentEl) return;

  const host = new Container().setClass("WorkspaceDockHost");
  host.setStyle("display", ["flex"]);
  host.setStyle("flexDirection", ["column"]);
  host.setStyle("height", ["100%"]);
  host.setStyle("minHeight", ["0"]);
  host.setStyle("overflowY", ["auto"]);

  while (contentEl.firstChild) {
    host.dom.appendChild(contentEl.firstChild);
  }

  fp._dockedWorkspace = { position, tabId, hostDom: host.dom };

  const cleanupFloat = lm.registerTabFloatHandler(position, tabId, () => {
    undockWorkspacePanelFromDom(host.dom);
  });

  workspaceDockMeta.set(host.dom, {
    fp,
    lm,
    position,
    tabId,
    scrollAreaEl: host.dom,
    cleanupFloat,
  });

  const addOpts = { open: true, replace: true, floatable: true };
  lm.addTab(position, tabId, label, host, addOpts);
  lm.selectTab(position, tabId, { open: true });
  fp.dom.remove();
}

/**
 * @param {HTMLElement} hostDom
 * @returns {import('../overlays/FloatingWindow.js').FloatingWindow|null}
 * @category Shell
 */
function undockWorkspacePanelFromDom(hostDom) {
  const meta = workspaceDockMeta.get(hostDom);
  if (!meta) return null;
  const { fp, lm, position, tabId, scrollAreaEl, cleanupFloat } = meta;
  if (typeof cleanupFloat === "function") {
    cleanupFloat();
  }
  lm.removeTab(position, tabId, { closeIfEmpty: true });
  const target = fp.content;
  while (scrollAreaEl.firstChild) {
    target.appendChild(scrollAreaEl.firstChild);
  }
  workspaceDockMeta.delete(hostDom);
  fp._dockedWorkspace = null;
  const mountEl = resolveFloatingMountElement(lm);
  if (mountEl) {
    fp.mountFloating(mountEl);
  }
  return fp;
}
