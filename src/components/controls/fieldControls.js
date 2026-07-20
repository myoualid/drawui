import { Button } from "../../primitives/ui.js";

/**
 * Compact button for toolbars and field-control wrappers.
 *
 * @example <caption>Basic</caption>
 * // live
 * return new ToolbarButton("Action");
 *
 * @category Inputs
 */
class ToolbarButton extends Button {
  constructor(text = "", extraStyles = {}) {
    super(text);

    this.setStyles({
      fontSize: "11px",
      padding: "4px 8px",
      ...extraStyles,
    });
  }
}

export { ToolbarButton };
