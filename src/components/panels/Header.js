import { StackPanel, Icon, TextBlock } from "../../primitives/ui.js";

/**
 * Shared header row for {@link ContentPanel} chrome.
 * @category Panels
 */
export class Header extends StackPanel {
  /**
   * @param {Object} [options]
   * @param {string} [options.title='']
   * @param {string} [options.icon]
   * @param {import('../../primitives/ui.js').Control[]} [options.actions]
   * @param {boolean} [options.alwaysActionsColumn=false]
   */
  constructor(options = {}) {
    super({ isVertical: false });

    const {
      title = "",
      icon,
      actions = [],
      alwaysActionsColumn = false,
    } = options;

    this.addClass("Header");
    this.setDisplay("flex");
    this
      .setStyle("justify-content", ["space-between"])
      .setStyle("align-items", ["center"])
      .setStyle("width", ["100%"])
      .setStyle("flex-shrink", ["0"]);

    const headerLeft = new StackPanel({ isVertical: false });
    headerLeft.setDisplay("flex");
    headerLeft.setStyle("align-items", ["center"]).setStyle("gap", ["0.5rem"]);

    this.iconElement = null;
    if (icon) {
      this.iconElement = new Icon(icon);
      headerLeft.add(this.iconElement);
    }

    this.titleElement = new TextBlock(title);
    headerLeft.add(this.titleElement);
    this.add(headerLeft);

    this.actions = null;
    if (actions.length > 0 || alwaysActionsColumn) {
      this.actions = new StackPanel({ isVertical: false });
      this.actions.setDisplay("flex");
      this.actions.setStyle("gap", ["0.5rem"]);
      for (const action of actions) this.actions.add(action);
      this.add(this.actions);
    }
  }

  setTitle(title) {
    this.titleElement.setValue(title);
    return this;
  }

  setIcon(iconName) {
    if (this.iconElement) this.iconElement.setIcon(iconName);
    return this;
  }

  addAction(action) {
    if (!this.actions) {
      this.actions = new StackPanel({ isVertical: false });
      this.actions.setDisplay("flex");
      this.actions.setStyle("gap", ["0.5rem"]);
      this.add(this.actions);
    }
    this.actions.add(action);
    return this;
  }
}
