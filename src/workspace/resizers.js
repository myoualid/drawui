import { Container } from "../primitives/ui.js";

/**
 * @typedef {'left' | 'right' | 'bottom' | 'stack'} LayoutResizerKind
 */

/**
 * @param {LayoutResizerKind} kind
 * @param {number} [resizerSize=7]
 * @returns {HTMLElement}
 * @category Shell
 */
export function createLayoutResizerElement(kind, resizerSize = 7) {
  const isRowResize = kind === 'bottom' || kind === 'stack';
  const appearanceKind = kind === 'stack' ? 'bottom' : kind;

  const resizer = new Container()
    .setClass(`layout-resizer layout-resizer-${appearanceKind}${kind === 'stack' ? ' layout-resizer-stack' : ''}`)
    .setStyles({
      width: isRowResize ? '100%' : `${resizerSize}px`,
      height: isRowResize ? `${resizerSize}px` : '100%',
      cursor: isRowResize ? 'row-resize' : 'col-resize',
      background: 'transparent',
      zIndex: '100',
      flexShrink: '0',
      touchAction: 'none',
    });

  resizer.dom.style.transition = 'background 0.15s ease';
  return resizer.dom;
}

/**
 * @param {HTMLElement} resizerElement
 * @param {{
 *   onDragStart?: (event: PointerEvent) => object|null|undefined,
 *   onDragMove: (event: PointerEvent, dragState: object) => void,
 *   onDoubleClick?: () => void,
 * }} options
 * @returns {() => void}
 * @category Shell
 */
export function bindLayoutResizerDrag(resizerElement, options = {}) {
  const { onDragStart, onDragMove, onDoubleClick } = options;

  if (!resizerElement || typeof onDragMove !== 'function') {
    return function noopLayoutResizerCleanup() {};
  }

  let dragState = null;
  let overlayElement = null;

  const resolveCursor = () => {
    if (
      resizerElement.classList.contains('layout-resizer-left')
      || resizerElement.classList.contains('layout-resizer-right')
    ) {
      return 'col-resize';
    }

    return 'row-resize';
  };

  const endDrag = () => {
    if (!dragState) {
      return;
    }

    const { pointerId } = dragState;

    resizerElement.classList.remove('active');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    if (resizerElement.hasPointerCapture(pointerId)) {
      resizerElement.releasePointerCapture(pointerId);
    }

    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerCancel);

    if (overlayElement) {
      overlayElement.remove();
      overlayElement = null;
    }

    dragState = null;
  };

  const onPointerMove = (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    onDragMove(event, dragState);
  };

  const onPointerUp = (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    endDrag();
  };

  const onPointerCancel = (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    endDrag();
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    const nextDragState = typeof onDragStart === 'function' ? onDragStart(event) : {};
    if (!nextDragState) {
      return;
    }

    dragState = {
      ...nextDragState,
      pointerId: event.pointerId,
    };

    document.body.style.cursor = resolveCursor();
    document.body.style.userSelect = 'none';
    resizerElement.classList.add('active');

    const overlay = new Container()
      .addClass('layout-drag-overlay')
      .setStyles({
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        zIndex: '9999',
        background: 'transparent',
        touchAction: 'none',
      });
    overlayElement = overlay.dom;
    document.body.appendChild(overlayElement);

    resizerElement.setPointerCapture(event.pointerId);

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
  };

  resizerElement.addEventListener('pointerdown', onPointerDown);

  let doubleClickHandler = null;
  if (typeof onDoubleClick === 'function') {
    doubleClickHandler = () => onDoubleClick();
    resizerElement.addEventListener('dblclick', doubleClickHandler);
  }

  return function cleanupLayoutResizerDrag() {
    resizerElement.removeEventListener('pointerdown', onPointerDown);

    if (doubleClickHandler) {
      resizerElement.removeEventListener('dblclick', doubleClickHandler);
    }

    endDrag();
  };
}
