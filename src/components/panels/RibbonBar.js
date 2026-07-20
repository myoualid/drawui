import { StackPanel } from "../../primitives/ui.js";

/**
 * Horizontal ribbon / action row for panel footers or the app shell ribbon.
 *
 * Pair with {@link RibbonButton} for tab-style module toggles, or
 * {@link IconButton} for bordered tile actions.
 *
 * @example <caption>RibbonBar</caption>
 * // live
 * return new RibbonBar([
 *   new RibbonButton("Project", { icon: "folder_open" }),
 *   new RibbonButton("Properties", { icon: "tune", active: true }),
 *   new RibbonButton("Console", { icon: "terminal" }),
 * ], "flex-start");
 *
 * @category Panels
 */
export class RibbonBar extends StackPanel {
  /**
   * @param {import('../../primitives/ui.js').Control[]} [elements]
   * @param {string} [justify='flex-end']
   */
  constructor(elements = [], justify = "flex-end") {
    super({ isVertical: false });

    this.addClass("RibbonBar");
    this.setDisplay("flex");
    this
      .setStyle("justify-content", [justify])
      .setStyle("align-items", ["stretch"])
      .setStyle("gap", ["2px"]);

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
