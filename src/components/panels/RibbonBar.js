import { StackPanel, Button } from "../../primitives/ui.js";

/**
 * Horizontal ribbon / action row for panel footers or the app shell ribbon.
 * Children are {@link Button}s. Buttons inside a ribbon are styled by `.RibbonBar .Button`.
 *
 * @example <caption>RibbonBar</caption>
 * // live
 * return new RibbonBar([
 *   new Button("Project").setIcon("folder_open"),
 *   new Button("Properties").setIcon("tune").addClass("selected"),
 *   new Button("Console").setIcon("terminal"),
 * ], "flex-start");
 *
 * @category Panels
 */
export class RibbonBar extends StackPanel {
  /**
   * @param {import('../../primitives/ui.js').Control[]} [elements]
   * @param {string} [justify] - Optional override; shell and panel contexts set alignment in CSS.
   */
  constructor(elements = [], justify) {
    super({ isVertical: false });

    this.addClass("RibbonBar");
    if (justify !== undefined) {
      this.setJustify(justify);
    }

    for (const element of elements) {
      if (element) this.add(element);
    }
  }

  /**
   * @param {string} justify
   * @returns {this}
   */
  setJustify(justify) {
    this.setStyle("justify-content", [justify]);
    return this;
  }
}
