import { Container } from "../../primitives/ui.js";

/**
 * Flex split host for resizable pane layouts.
 * @category Shell
 */
export class SplitContainer extends Container {
  /**
   * @param {'horizontal'|'vertical'} direction
   * @param {Array} [children=[]]
   */
  constructor(direction, children = []) {
    super();
    this.setClass("split-container");
    this.dom.style.display = "flex";
    this.dom.style.flexDirection = direction === "horizontal" ? "row" : "column";
    this.dom.style.flex = "1";
    this.dom.style.gap = "0";

    children.forEach((child) => {
      if (child?.dom) this.add(child);
      else if (child) this.dom.appendChild(child);
    });
  }
}
