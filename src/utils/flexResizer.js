import { Container } from "../primitives/ui.js";

/**
 * @typedef {'left' | 'right' | 'bottom'} FlexResizerPlacement
 */

/**
 * Visual handle for a declarative split-tree resizer.
 * @param {{ direction?: string, id?: string }} splitNode
 * @param {number} childIndex
 * @returns {Container}
 *
 * @example <caption>Note</caption>
 * // live
 * return new Disclaimer(
 *   "createSplitResizer(splitNode, childIndex) builds a resizer for SplitContainer children.",
 * );
 *
 * @category Utils
 */
export function createSplitResizer(splitNode, childIndex) {
  const resizer = new Container();
  resizer.setClass(
    `layout-resizer layout-resizer-${splitNode.direction === "horizontal" ? "right" : "bottom"}`,
  );
  resizer.dom.dataset.splitId = splitNode.id || "root";
  resizer.dom.dataset.childIndex = String(childIndex);
  resizer.dom.dataset.direction = splitNode.direction;
  return resizer;
}

/**
 * Visual handle for a workspace / pane edge.
 * @param {FlexResizerPlacement} [placement='right']
 * @returns {Container}
 *
 * @example <caption>Right handle</caption>
 * // live
 * return createLayoutResizerHandle("right").setStyle("height", ["4rem"]);
 *
 * @category Utils
 */
export function createLayoutResizerHandle(placement = "right") {
  const resizer = new Container();
  resizer.setClass(`layout-resizer layout-resizer-${placement}`);
  resizer.dom.setAttribute("role", "separator");
  resizer.dom.setAttribute(
    "aria-orientation",
    placement === "bottom" ? "horizontal" : "vertical",
  );
  return resizer;
}

/**
 * @typedef {Object} FlexResizerOptions
 * @property {HTMLElement} resizer - Resizer handle element
 * @property {HTMLElement} leading - Pane before the resizer (left or top)
 * @property {HTMLElement} [container] - Root element for CSS variables (defaults to leading parent)
 * @property {FlexResizerPlacement} [placement='right']
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
 * @category Utils
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
 * @param {FlexResizerOptions} options
 * @returns {() => void} cleanup
 *
 * @example <caption>Note</caption>
 * // live
 * return new Disclaimer(
 *   "makeFlexResizer(options) returns a teardown function for flex sibling resizing.",
 * );
 *
 * @category Utils
 */
export function makeFlexResizer(options) {
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

    const overlayElement = new Container().addClass("layout-drag-overlay");
    overlay = overlayElement.dom;
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
