import { Container, Icon, Text } from "../../primitives/ui.js";

/**
 * Bordered summary of one item: an icon beside a bold title and a secondary
 * line. The secondary line hides while it is empty.
 *
 * @example
 * const card = new SummaryCard({ icon: "deployed_code", title: "IfcWall", subtitle: "STANDARD" });
 * card.setTitle("IfcSlab").setSubtitle("FLOOR");
 *
 * @category Collections
 */
export class SummaryCard extends Container {
  /**
   * @param {Object} [options]
   * @param {string} [options.icon]
   * @param {string} [options.title=""]
   * @param {string} [options.subtitle=""]
   */
  constructor(options = {}) {
    super();

    const { icon = "", title = "", subtitle = "" } = options;

    this.addClass("SummaryCard");

    this.iconElement = new Icon(icon);
    this.iconElement.addClass("SummaryCard-icon");
    this.titleElement = new Text("").addClass("SummaryCard-title");
    this.subtitleElement = new Text("").addClass("SummaryCard-subtitle");

    const text = new Container().addClass("SummaryCard-text");
    text.add(this.titleElement, this.subtitleElement);
    this.add(this.iconElement, text);

    this.setIcon(icon).setTitle(title).setSubtitle(subtitle);
  }

  /**
   * @param {string} title
   * @returns {this}
   */
  setTitle(title) {
    const value = title == null ? "" : String(title);
    this.titleElement.setValue(value);
    this.titleElement.dom.title = value;
    return this;
  }

  /**
   * @param {string} subtitle
   * @returns {this}
   */
  setSubtitle(subtitle) {
    const value = subtitle == null ? "" : String(subtitle);
    this.subtitleElement.setValue(value);
    this.subtitleElement.dom.title = value;
    this.subtitleElement.setHidden(!value);
    return this;
  }

  /**
   * @param {string} icon
   * @returns {this}
   */
  setIcon(icon) {
    if (icon) this.iconElement.setIcon(icon);
    this.iconElement.setHidden(!icon);
    return this;
  }
}
