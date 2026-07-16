import { UIColumn } from "../primitives/ui.js";

/**
 * @typedef {{ className?: string, scrollable?: boolean }} LayoutPaneOptions
 */

/**
 * Flex-fill column region used inside layout shells such as {@link SidebarLayout}.
 */
export class LayoutPane extends UIColumn {
  /**
   * @param {LayoutPaneOptions} [options]
   */
  constructor(options = {}) {
    super();

    const { className = "", scrollable = false } = options;

    this.gap("0");
    this.setStyle("flex", ["1 1 auto"]);
    this.setStyle("minHeight", ["0"]);
    this.setStyle("minWidth", ["0"]);
    this.setStyle("overflow", [scrollable ? "auto" : "hidden"]);

    if (className) {
      this.addClass(className);
    }
  }
}
