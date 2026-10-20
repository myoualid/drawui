import { Container, Icon } from "../../primitives/ui.js";

/**
 * Icon-only button.
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
    this._icon.setIcon(iconName);
    return this;
  }
}

export default Operator;
