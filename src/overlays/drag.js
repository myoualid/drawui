import { Container } from "../primitives/ui.js";

/**
 * For position:absolute, left/top are relative to offsetParent — not the viewport.
 * getBoundingClientRect() is viewport-based; convert so drag math stays consistent.
 * @param {HTMLElement} el
 * @returns {{ left: number, top: number }}
 * @category Overlays
 */
function positionForAbsoluteDrag(el) {
  const rect = el.getBoundingClientRect();
  const op = el.offsetParent;
  if (op instanceof HTMLElement) {
    const pr = op.getBoundingClientRect();
    return {
      left: rect.left - pr.left + op.scrollLeft,
      top: rect.top - pr.top + op.scrollTop,
    };
  }
  return { left: rect.left, top: rect.top };
}

/**
 * Attach header-drag behavior to a positioned panel.
 *
 * @example <caption>Note</caption>
 * // live
 * return new Disclaimer(
 *   "makeDraggable(panel, header) attaches drag behavior — used by FloatingWindow / FloatingDialog.",
 * );
 *
 * @category Overlays
 */
export function makeDraggable(panel, header) {
    let isDragging = false;

    let startX, startY, startLeft, startTop;

    header.style.cursor = 'grab';

    const onMouseMove = (e) => {
      if (!isDragging) return;

      panel.style.left = `${startLeft + e.clientX - startX}px`;

      panel.style.top = `${startTop + e.clientY - startY}px`;

      header.style.cursor = 'grabbing';
    };

    const onMouseUp = () => {
      isDragging = false;

      panel.style.transition = '';

      header.style.cursor = 'grab';
    };

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;

      const eventTarget = e.target;
      if (
        eventTarget &&
        eventTarget.nodeType === 1 &&
        typeof eventTarget.closest === 'function' &&
        eventTarget.closest('.resize-handle')
      ) {
        return;
      }

      isDragging = true;

      startX = e.clientX;

      startY = e.clientY;

      const { left, top } = positionForAbsoluteDrag(panel);

      startLeft = left;

      startTop = top;

      panel.style.transition = 'none';

      // Clear right/bottom positioning to prevent conflicts with left/top
      panel.style.right = '';

      panel.style.bottom = '';

      // Clear transform to prevent conflicts with positioning
      panel.style.transform = '';

      panel.style.left = `${startLeft}px`;

      panel.style.top = `${startTop}px`;

      e.preventDefault();
    });

    document.addEventListener('mousemove', onMouseMove);

    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }

/**
 * Attach edge/corner resize handles to a positioned panel.
 *
 * @example <caption>Note</caption>
 * // live
 * return new Disclaimer(
 *   "makeResizable(panel, directions) attaches edge resize — used by floating overlays.",
 * );
 *
 * @category Overlays
 */
export function makeResizable(panel, directions= []) {
    if (!directions || directions.length === 0) {

      directions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

    }
    
    directions.forEach(dir => {
      const handle = new Container().addClass(`resize-handle ${dir}`);
      const handleDom = handle.dom;

      handleDom.style.position = 'absolute';

      handleDom.style.background = 'transparent';

      handleDom.style.zIndex = '10';
      
      if (dir.includes('n')) {
        handleDom.style.top = '0';

        handleDom.style.height = '5px';

        handleDom.style.width = '100%';

        handleDom.style.cursor = 'n-resize';
      }

      if (dir.includes('s')) {
        handleDom.style.bottom = '0';

        handleDom.style.height = '5px';

        handleDom.style.width = '100%';

        handleDom.style.cursor = 's-resize';
      }

      if (dir.includes('e')) {
        handleDom.style.right = '0';

        handleDom.style.width = '5px';

        handleDom.style.height = '100%';

        handleDom.style.cursor = 'e-resize';
      }

      if (dir.includes('w')) {
        handleDom.style.left = '0';

        handleDom.style.width = '5px';

        handleDom.style.height = '100%';

        handleDom.style.cursor = 'w-resize';
      }

      if (dir === 'ne') {
        handleDom.style.top = '0';

        handleDom.style.right = '0';

        handleDom.style.width = '10px';

        handleDom.style.height = '10px';

        handleDom.style.cursor = 'ne-resize';
      }

      if (dir === 'nw') {
        handleDom.style.top = '0';

        handleDom.style.left = '0';

        handleDom.style.width = '10px';

        handleDom.style.height = '10px';

        handleDom.style.cursor = 'nw-resize';
      }

      if (dir === 'se') {
        handleDom.style.bottom = '0';

        handleDom.style.right = '0';

        handleDom.style.width = '10px';

        handleDom.style.height = '10px';

        handleDom.style.cursor = 'se-resize';
      }

      if (dir === 'sw') {
        handleDom.style.bottom = '0';

        handleDom.style.left = '0';

        handleDom.style.width = '10px';

        handleDom.style.height = '10px';

        handleDom.style.cursor = 'sw-resize';
      }
      
      panel.appendChild(handleDom);
      
      let isResizing = false;

      let startX, startY, startWidth, startHeight, startLeft, startTop;
      
      handleDom.onmousedown = (e) => {
        isResizing = true;

        startX = e.clientX;

        startY = e.clientY;

        startWidth = panel.offsetWidth;

        startHeight = panel.offsetHeight;

        startLeft = panel.offsetLeft;

        startTop = panel.offsetTop;

        panel.style.transition = 'none';  // Disable transitions during resize

        e.preventDefault();

        e.stopPropagation();
      };
      
      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const dx = e.clientX - startX;

        const dy = e.clientY - startY;
        
        if (dir.includes('e')) {
          panel.style.width = `${Math.max(200, startWidth + dx)}px`;
        }

        if (dir.includes('w')) {
          const newWidth = Math.max(200, startWidth - dx);

          panel.style.width = `${newWidth}px`;

          panel.style.left = `${startLeft + (startWidth - newWidth)}px`;
        }

        if (dir.includes('s')) {
          panel.style.height = `${Math.max(150, startHeight + dy)}px`;
        }

        if (dir.includes('n')) {
          const newHeight = Math.max(150, startHeight - dy);

          panel.style.height = `${newHeight}px`;

          panel.style.top = `${startTop + (startHeight - newHeight)}px`;
        }
      });
      
      document.addEventListener('mouseup', () => {
        isResizing = false;

        panel.style.transition = '';  // Re-enable transitions
      });
    });
  }