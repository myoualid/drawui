import { StackPanel, Icon, Text } from "../../primitives/ui.js";

/**
 * Title row inside panel chrome. Not a public component — set it with {@link Panel#header}.
 * @internal
 */
export class Header extends StackPanel {
  /**
   * @param {Object} [options]
   * @param {string} [options.title='']
   * @param {string} [options.icon]
   * @param {import('../../primitives/ui.js').Control[]} [options.leadingActions]
   * @param {import('../../primitives/ui.js').Control[]} [options.actions]
   * @param {boolean} [options.alwaysActionsColumn=false]
   */
  constructor(options = {}) {
    super({ isVertical: false });

    const {
      title = "",
      icon,
      leadingActions = [],
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

    this.headerLeft = new StackPanel({ isVertical: false });
    this.headerLeft.setDisplay("flex");
    this.headerLeft
      .setStyle("align-items", ["center"])
      .setStyle("gap", ["0.5rem"])
      .setStyle("min-width", ["0"])
      .setStyle("flex", ["1 1 auto"]);

    this.leadingSlot = new StackPanel({ isVertical: false });
    this.leadingSlot.setDisplay("flex");
    this.leadingSlot.setStyle("align-items", ["center"]).setStyle("gap", ["0.5rem"]);
    this.headerLeft.add(this.leadingSlot);
    this._applyLeadingActions(leadingActions);

    this.iconElement = null;
    if (icon) {
      this.iconElement = new Icon(icon);
      this.headerLeft.add(this.iconElement);
    }

    this.titleElement = new Text(title);
    this.headerLeft.add(this.titleElement);
    this.add(this.headerLeft);

    this.actions = null;
    if (actions.length > 0 || alwaysActionsColumn) {
      this.actions = new StackPanel({ isVertical: false });
      this.actions.setDisplay("flex");
      this.actions
        .setStyle("gap", ["0.5rem"])
        .setStyle("align-items", ["center"])
        .setStyle("flex-shrink", ["0"]);
      for (const action of actions) this.actions.add(action);
      this.add(this.actions);
    }
  }

  /**
   * @param {import('../../primitives/ui.js').Control[]} actions
   * @private
   */
  _applyLeadingActions(actions) {
    this.leadingSlot.clear();
    for (const action of actions) this.leadingSlot.add(action);
    this.leadingSlot.setStyle("display", [actions.length > 0 ? "flex" : "none"]);
    return this;
  }

  /**
   * Replace leading controls (e.g. drill-down back button).
   * @param {import('../../primitives/ui.js').Control[]} [actions=[]]
   * @returns {this}
   */
  setLeadingActions(actions = []) {
    return this._applyLeadingActions(Array.isArray(actions) ? actions : [actions]);
  }

  setTitle(title) {
    this.titleElement.setValue(title);
    return this;
  }

  setIcon(iconName) {
    if (!iconName) {
      this.iconElement?.setHidden(true);
      return this;
    }

    if (!this.iconElement) {
      this.iconElement = new Icon(iconName);
      this.headerLeft.dom.insertBefore(this.iconElement.dom, this.titleElement.dom);
    } else {
      this.iconElement.setIcon(iconName);
      this.iconElement.setHidden(false);
    }

    return this;
  }

  addAction(action) {
    if (!this.actions) {
      this.actions = new StackPanel({ isVertical: false });
      this.actions.setDisplay("flex");
      this.actions
        .setStyle("gap", ["0.5rem"])
        .setStyle("align-items", ["center"])
        .setStyle("flex-shrink", ["0"]);
      this.add(this.actions);
    }
    this.actions.add(action);
    return this;
  }
}
