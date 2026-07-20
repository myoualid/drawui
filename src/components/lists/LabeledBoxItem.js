import {
  InputListItem,
  Checkbox,
  Icon,
  TextBlock,
  Container,
} from "../../primitives/ui.js";

/**
 * Workspace menu row: checkbox + icon + label + actions slot.
 * @category Collections
 */
export class LabeledBoxItem extends InputListItem {
  /**
   * @param {{ id: string, label: string, checked?: boolean }} data
   * @param {Record<string, string>} iconMap
   */
  constructor(data, iconMap) {
    super();
    this.addClass("workspace-menu-item");

    const checkbox = new Checkbox(data.checked);
    const iconName = iconMap[data.id] || iconMap.default;
    const icon = new Icon(iconName);
    icon.addClass("workspace-menu-item-icon");

    const label = new TextBlock(data.label);
    label.addClass("workspace-menu-item-label");

    const actions = new Container();
    actions.addClass("workspace-menu-item-actions");

    this.add(checkbox);
    this.add(icon);
    this.add(label);
    this.add(actions);
  }
}
