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
    this.setClass(direction === "horizontal" ? "SplitContainer Row" : "SplitContainer Column");

    children.forEach((child) => {
      if (child?.dom) this.add(child);
      else if (child) this.dom.appendChild(child);
    });
  }
}
