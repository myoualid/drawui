/**
 * @typedef {'left' | 'right' | 'bottom'} LayoutResizerPlacement
 */

/**
 * @typedef {Object} LayoutResizerOptions
 * @property {HTMLElement} resizer - Resizer handle element
 * @property {HTMLElement} leading - Pane before the resizer (left or top)
 * @property {HTMLElement} [container] - Root element for CSS variables (defaults to leading parent)
 * @property {LayoutResizerPlacement} [placement='right']
 * @property {string} [cssVariable] - CSS custom property to update (e.g. `--dui-sidebar-width`)
 * @property {string} [minCssVariable] - Min size CSS variable on container
 * @property {string} [maxCssVariable] - Max size CSS variable on container
 * @property {number} [minSize] - Explicit min size in pixels
 * @property {number} [maxSize] - Explicit max size in pixels
 * @property {(size: number) => void} [onResize] - Custom resize handler
 */

/**
 * @param {HTMLElement} element
 * @param {string} variableName
 * @returns {number | null}
 */
function readCssVarPx(element, variableName) {
  if (!element || !variableName) {
    return null;
  }

  const raw = getComputedStyle(element).getPropertyValue(variableName).trim();
  const match = raw.match(/^([\d.]+)px$/);

  return match ? Number.parseFloat(match[1]) : null;
}

/**
 * Attach drag-to-resize behavior between two flex siblings.
 * @param {LayoutResizerOptions} options
 * @returns {() => void} cleanup
 */
export function makeLayoutResizer(options) {
  const {
    resizer,
    leading,
    container = leading?.parentElement,
    placement = "right",
    cssVariable = null,
    minCssVariable = null,
    maxCssVariable = null,
    minSize = null,
    maxSize = null,
    onResize = null,
  } = options;

  if (!resizer || !leading) {
    return () => {};
  }

  const isVertical = placement === "bottom";
  const sizeKey = isVertical ? "height" : "width";
  const cursor = isVertical ? "row-resize" : "col-resize";
  const deltaSign = placement === "left" ? -1 : 1;

  let overlay = null;
  let isDragging = false;
  let startPos = 0;
  let startSize = 0;

  const resolveMinSize = () => {
    if (minSize != null) {
      return minSize;
    }

    if (container && minCssVariable) {
      const fromVar = readCssVarPx(container, minCssVariable);
      if (fromVar != null) {
        return fromVar;
      }
    }

    return 0;
  };

  const resolveMaxSize = () => {
    if (maxSize != null) {
      return maxSize;
    }

    if (container && maxCssVariable) {
      const fromVar = readCssVarPx(container, maxCssVariable);
      if (fromVar != null) {
        return fromVar;
      }
    }

    return Number.POSITIVE_INFINITY;
  };

  const applySize = (size) => {
    const clamped = Math.max(
      resolveMinSize(),
      Math.min(resolveMaxSize(), Math.round(size))
    );

    if (typeof onResize === "function") {
      onResize(clamped);
      return clamped;
    }

    if (container && cssVariable) {
      container.style.setProperty(cssVariable, `${clamped}px`);
      return clamped;
    }

    leading.style[sizeKey] = `${clamped}px`;
    leading.style.flex = `0 0 ${clamped}px`;

    return clamped;
  };

  const stopDragging = () => {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    resizer.classList.remove("active");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  };

  const onMouseMove = (event) => {
    if (!isDragging) {
      return;
    }

    const currentPos = isVertical ? event.clientY : event.clientX;
    const delta = (currentPos - startPos) * deltaSign;

    applySize(startSize + delta);
  };

  const onMouseDown = (event) => {
    event.preventDefault();

    isDragging = true;
    startPos = isVertical ? event.clientY : event.clientX;
    startSize = leading.getBoundingClientRect()[sizeKey];

    resizer.classList.add("active");
    document.body.style.cursor = cursor;
    document.body.style.userSelect = "none";

    overlay = document.createElement("div");
    overlay.className = "layout-drag-overlay";
    document.body.appendChild(overlay);
  };

  resizer.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", stopDragging);

  return () => {
    resizer.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", stopDragging);
    stopDragging();
  };
}
