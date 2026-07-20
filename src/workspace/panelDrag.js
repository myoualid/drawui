/**
 * Dry pointer-drag helper: move a docked panel group between workspace regions.
 * Component chrome (what is a drag handle, what clicks to ignore) is supplied by
 * the caller — typically {@link WorkspacePanel}.
 *
 * @module workspace/panelDrag
 */

/**
 * @param {import('./WorkspaceLayout.js').WorkspaceLayout} layout
 * @param {'left' | 'right' | 'bottom' | null} position
 * @category Shell
 */
export function setPanelDropHighlight(layout, position) {
  if (layout._segmentDropHighlight) {
    layout._segmentDropHighlight.classList.remove("is-panel-drop-target");
    layout._segmentDropHighlight = null;
  }

  if (!position) return;

  const workspaceElement = layout.workspaces[position];
  if (workspaceElement instanceof HTMLElement) {
    workspaceElement.classList.add("is-panel-drop-target");
    layout._segmentDropHighlight = workspaceElement;
  }
}

/** @deprecated Use {@link setPanelDropHighlight} */
export const setSegmentDropHighlight = setPanelDropHighlight;

/**
 * @typedef {Object} PanelRegionDragOptions
 * @property {() => 'left'|'right'|'bottom'} getFromPosition
 * @property {() => string} getOwnerKey
 * @property {HTMLElement} panelElement
 * @property {HTMLElement} handleElement
 * @property {(target: EventTarget|null) => boolean} [isIgnoredTarget]
 */

/**
 * @param {import('./WorkspaceLayout.js').WorkspaceLayout} layout
 * @param {PanelRegionDragOptions} options
 * @returns {() => void} cleanup
 * @category Shell
 */
export function bindPanelRegionDrag(layout, options) {
  const {
    getFromPosition,
    getOwnerKey,
    panelElement,
    handleElement,
    isIgnoredTarget = () => false,
  } = options;

  if (!(handleElement instanceof HTMLElement) || !(panelElement instanceof HTMLElement)) {
    return () => {};
  }

  handleElement.classList.add("is-panel-drag-handle");

  let drag = null;

  const resetDragVisuals = () => {
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
    panelElement.classList.remove("is-panel-dragging");
    setPanelDropHighlight(layout, null);
  };

  const resolveDropTarget = (clientX, clientY) => {
    for (const position of ["left", "right", "bottom"]) {
      const workspaceElement = layout.workspaces[position];
      if (!(workspaceElement instanceof HTMLElement)) continue;

      if (layout.isWorkspaceOpen(position)) {
        const rect = workspaceElement.getBoundingClientRect();
        if (
          rect.width > 0
          && rect.height > 0
          && clientX >= rect.left
          && clientX <= rect.right
          && clientY >= rect.top
          && clientY <= rect.bottom
        ) {
          return position;
        }
        continue;
      }

      const toggleButton = layout.toggleButtons?.[position]?.dom;
      if (toggleButton instanceof HTMLElement) {
        const rect = toggleButton.getBoundingClientRect();
        if (
          clientX >= rect.left
          && clientX <= rect.right
          && clientY >= rect.top
          && clientY <= rect.bottom
        ) {
          layout.openWorkspace(position);
          return position;
        }
      }
    }

    return null;
  };

  const onPointerDown = (event) => {
    if (event.button !== 0 || isIgnoredTarget(event.target)) return;

    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
      dropTarget: null,
    };

    handleElement.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.started) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 4) {
        return;
      }
      drag.started = true;
      panelElement.classList.add("is-panel-dragging");
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    }

    const dropTarget = resolveDropTarget(event.clientX, event.clientY);
    const fromPosition = getFromPosition();
    const highlightTarget = dropTarget && dropTarget !== fromPosition ? dropTarget : null;

    if (drag.dropTarget !== highlightTarget) {
      drag.dropTarget = highlightTarget;
      setPanelDropHighlight(layout, highlightTarget);
    }
  };

  const onPointerUp = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (handleElement.hasPointerCapture(event.pointerId)) {
      handleElement.releasePointerCapture(event.pointerId);
    }

    const wasDragging = drag.started;
    const dropTarget = wasDragging ? drag.dropTarget : null;
    const fromPosition = getFromPosition();
    const ownerKey = getOwnerKey();
    drag = null;

    if (wasDragging) {
      resetDragVisuals();
      if (dropTarget && dropTarget !== fromPosition && ownerKey) {
        layout.moveSegment(fromPosition, dropTarget, ownerKey);
      }
    }
  };

  const onPointerCancel = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (handleElement.hasPointerCapture(event.pointerId)) {
      handleElement.releasePointerCapture(event.pointerId);
    }

    drag = null;
    resetDragVisuals();
  };

  handleElement.addEventListener("pointerdown", onPointerDown);
  handleElement.addEventListener("pointermove", onPointerMove);
  handleElement.addEventListener("pointerup", onPointerUp);
  handleElement.addEventListener("pointercancel", onPointerCancel);

  return () => {
    handleElement.removeEventListener("pointerdown", onPointerDown);
    handleElement.removeEventListener("pointermove", onPointerMove);
    handleElement.removeEventListener("pointerup", onPointerUp);
    handleElement.removeEventListener("pointercancel", onPointerCancel);
    handleElement.classList.remove("is-panel-drag-handle");
    drag = null;
    resetDragVisuals();
  };
}

/** @deprecated Use {@link bindPanelRegionDrag} */
export function bindSegmentHeaderDrag(layout, fromPosition, entry, headerElement) {
  return bindPanelRegionDrag(layout, {
    getFromPosition: () => fromPosition,
    getOwnerKey: () => entry.ownerKey,
    panelElement: entry.panelElement,
    handleElement: headerElement,
  });
}
