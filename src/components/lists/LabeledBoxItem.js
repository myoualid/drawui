import {
  InputListItem,
  Checkbox,
  Icon,
  Text,
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
    this.addClass("LabeledBoxItem");

    const checkbox = new Checkbox(data.checked);
    const iconName = iconMap[data.id] || iconMap.default;
    const icon = new Icon(iconName);
    icon.addClass("LabeledBoxItem-icon");

    const label = new Text(data.label);
    label.addClass("LabeledBoxItem-label");

    const actions = new Container();
    actions.addClass("LabeledBoxItem-actions");

    this.add(checkbox);
    this.add(icon);
    this.add(label);
    this.add(actions);
  }
}
