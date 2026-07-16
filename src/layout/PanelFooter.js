import { UIRow } from "../primitives/ui.js";

/**
 * Shared footer row for workspace panels.
 */
export class PanelFooter extends UIRow {
  /**
   * @param {import('../primitives/ui.js').UIElement[]} [elements]
   * @param {string} [justify='flex-end']
   */
  constructor(elements = [], justify = "flex-end") {
    super();

    this.setDisplay("flex");
    this
      .setStyle("justify-content", [justify])
      .setStyle("align-items", ["center"])
      .setStyle("padding", ["0.5rem 0.75rem"])
      .setStyle("gap", ["0.5rem"]);

    for (const element of elements) {
      this.add(element);
    }
  }

  /**
   * @param {import('../primitives/ui.js').UIElement} element
   * @returns {this}
   */
  addElement(element) {
    this.add(element);
    return this;
  }
}
