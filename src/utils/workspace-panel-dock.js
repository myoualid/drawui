import { UIDiv } from "../primitives/ui.js";


/** @type {WeakMap<HTMLElement, { fp: import('../overlays/FloatingPanel.js').FloatingPanel, lm: object, position: string, tabId: string, scrollAreaEl: HTMLElement, cleanupFloat?: () => void }>} */
const workspaceDockMeta = new WeakMap();

/**
 * Resolve the DOM element that floating panels should be appended to.
 * @param {object} lm - LayoutManager instance
 * @returns {HTMLElement|null}
 */
export function resolveFloatingMountElement(lm) {
  if (lm && typeof lm.getFloatingPanelMountElement === 'function') {
    const mountEl = lm.getFloatingPanelMountElement();
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
 */
export function buildWorkspaceDockHandlers({ layoutManager: lm, tabId, tabLabel }) {
  if (!lm || !tabId) return undefined;
  return {
    left: (fp) => dockFloatingPanelToWorkspace(fp, lm, "left", tabId, tabLabel),
    bottom: (fp) => dockFloatingPanelToWorkspace(fp, lm, "bottom", tabId, tabLabel),
    right: (fp) => dockFloatingPanelToWorkspace(fp, lm, "right", tabId, tabLabel),
  };
}

/**
 * Move floating panel body into a layout workspace tab. Undock uses the tab-strip float control
 * (floatable tab + LayoutManager.registerTabFloatHandler), not an in-panel toolbar.
 * @param {import('../overlays/FloatingPanel.js').FloatingPanel} fp
 * @param {{ addTab: Function, removeTab: Function, selectTab?: Function, registerTabFloatHandler?: Function }} lm
 * @param {'left'|'right'|'bottom'} position
 * @param {string} tabId
 * @param {string} [tabLabel]
 */
function dockFloatingPanelToWorkspace(fp, lm, position, tabId, tabLabel) {
  const sourceTabPanel = fp._sourceTabPanel;
  if (sourceTabPanel) return sourceTabPanel.restoreContentFromFloatingPanel(fp, lm, position, tabId, tabLabel);

  let fromTitle = "";
  const title = fp.title;
  if (title && title.text && title.text.dom) {
    const textNode = title.text.dom.textContent;
    if (textNode) fromTitle = textNode;
  }
  const label = tabLabel || fromTitle || tabId;
  const contentEl = fp.content;
  if (!contentEl) return;

  const host = new UIDiv().setClass("WorkspaceDockHost");
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
 * @returns {import('../overlays/FloatingPanel.js').FloatingPanel|null}
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
