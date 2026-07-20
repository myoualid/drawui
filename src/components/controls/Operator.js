import { Container, Icon } from "../../primitives/ui.js";

/**
 * Icon-only operator control (icon inside an Operator shell).
 * @category Inputs
 */
export class Operator extends Container {
  /**
   * @param {string} [name='']
   */
  constructor(name = "") {
    super();
    this.addClass("Operator");
    this._icon = new Icon(name);
    this.add(this._icon);
  }

  /**
   * @param {string} iconName
   * @returns {Operator}
   */
  setIcon(iconName) {
    this._icon.setName(iconName);
    return this;
  }
}

export default Operator;
