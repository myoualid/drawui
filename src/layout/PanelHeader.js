import { UIRow, UIIcon, UIText } from "../primitives/ui.js";

/**
 * Shared header row for workspace panels (BasePanel, TabPanel, module UIs).
 */
export class PanelHeader extends UIRow {
  /**
   * @param {Object} [options]
   * @param {string} [options.title='']
   * @param {string} [options.icon] - Material icon name
   * @param {import('../primitives/ui.js').UIElement[]} [options.actions]
   * @param {boolean} [options.alwaysActionsColumn=false] - Reserve an actions column (TabPanel adds controls later).
   */
  constructor(options = {}) {
    super();

    const {
      title = "",
      icon,
      actions = [],
      alwaysActionsColumn = false,
    } = options;

    this.setDisplay("flex");
    this
      .addClass("fill-parent")
      .setStyle("justify-content", ["space-between"])
      .setStyle("align-items", ["center"])
      .setStyle("padding", ["0.5rem 0.75rem"]);

    const headerLeft = new UIRow();
    headerLeft.setDisplay("flex");
    headerLeft.setStyle("align-items", ["center"]).setStyle("gap", ["0.5rem"]);

    this.iconElement = null;

    if (icon) {
      this.iconElement = new UIIcon(icon);
      this.iconElement.setStyle("font-size", ["1.2rem"]);
      headerLeft.add(this.iconElement);
    }

    this.titleElement = new UIText(title);
    this.titleElement.setStyle("font-weight", ["600"]).setStyle("font-size", ["0.9rem"]);
    headerLeft.add(this.titleElement);

    this.add(headerLeft);

    this.actions = null;

    if (actions.length > 0 || alwaysActionsColumn) {
      this.actions = new UIRow();
      this.actions.setDisplay("flex");
      this.actions.setStyle("gap", ["0.5rem"]);
      for (const action of actions) {
        this.actions.add(action);
      }
      this.add(this.actions);
    }
  }

  /**
   * @param {string} title
   * @returns {this}
   */
  setTitle(title) {
    this.titleElement.setValue(title);
    return this;
  }

  /**
   * @param {string} iconName
   * @returns {this}
   */
  setIcon(iconName) {
    if (this.iconElement) {
      this.iconElement.setIcon(iconName);
    }
    return this;
  }

  /**
   * @param {import('../primitives/ui.js').UIElement} action
   * @returns {this}
   */
  addAction(action) {
    if (!this.actions) {
      this.actions = new UIRow();
      this.actions.setDisplay("flex");
      this.actions.setStyle("gap", ["0.5rem"]);
      this.add(this.actions);
    }

    this.actions.add(action);
    return this;
  }
}
