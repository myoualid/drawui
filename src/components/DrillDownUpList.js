import {
  UIIcon,
  UIDiv,
  UIRow,
  UIText,
} from "../primitives/ui.js";
import { createHierarchicalListOptions } from "../utils/hierarchical-list-options.js";

/**
 * Hierarchical list that drills into children one level at a time,
 * with a back control to return up the stack.
 *
 * Same data shape as TreeView (`getChildren` / `getLabel`) so apps can
 * switch between drill-down and tree presentation without reshaping data.
 */
class DrillDownUpList {
  /**
   * @param {Object} [options={}]
   * @param {Function|null} [options.onItemClick] - (item, list) => void
   * @param {Function|null} [options.onNavigate] - (item, "forward"|"back") => void
   * @param {Function} [options.renderItem] - (item, list) => UIElement
   * @param {Function} [options.getChildren] - (item) => array
   * @param {Function} [options.getLabel] - (item) => string
   * @param {Function} [options.getTitle] - (item) => string
   * @param {string} [options.emptyMessage]
   * @param {boolean} [options.autoNavigate=true] - Drill into items that have children on click
   */
  constructor(options = {}) {
    this.history = [];
    this.currentData = null;
    this.rootData = null;

    const defaults = createHierarchicalListOptions(options);
    this.onItemClick = defaults.onItemClick;
    this.onNavigate = options.onNavigate || null;
    this.renderItem = options.renderItem || this.defaultRenderItem.bind(this);
    this.getChildren = defaults.getChildren;
    this.getLabel = defaults.getLabel;
    this.getTitle = options.getTitle || ((item) => item.name || "Items");
    this.emptyMessage = defaults.emptyMessage;
    this.autoNavigate = options.autoNavigate !== false;

    this.panel = new UIDiv();
    this.panel.addClass("dui-drill");
    this.panel.addClass("NavigableList");
    this.panel.dom.setAttribute("role", "navigation");

    this.header = new UIDiv();
    this.header.addClass("dui-drill-header");
    this.header.addClass("PanelHeader");
    this.header.addClass("Header");

    this.headerContent = new UIDiv();
    this.headerContent.addClass("dui-drill-header-content");
    this.header.add(this.headerContent);
    this.panel.add(this.header);

    this.content = new UIDiv();
    this.content.addClass("dui-drill-content");
    this.content.addClass("NavigableList-content");
    this.content.dom.setAttribute("role", "list");
    this.panel.add(this.content);
  }

  /**
   * @param {Object} data - Root node (typically has children)
   */
  setData(data) {
    this.rootData = data;
    this.currentData = data;
    this.history = [];
    this.refresh();
    return this;
  }

  /**
   * @param {Object} item
   */
  navigateTo(item) {
    this.history.push(this.currentData);
    this.currentData = item;
    this.refresh();
    if (this.onNavigate) this.onNavigate(item, "forward");
    return this;
  }

  navigateBack() {
    if (this.history.length === 0) return this;
    this.currentData = this.history.pop();
    this.refresh();
    if (this.onNavigate) this.onNavigate(this.currentData, "back");
    return this;
  }

  refresh() {
    if (!this.currentData) return;

    this.headerContent.clear();

    const headerRow = new UIRow();
    headerRow.addClass("dui-drill-header-row");

    if (this.history.length > 0) {
      const backBtn = new UIIcon("arrow_back");
      backBtn.addClass("dui-drill-back");
      backBtn.addClass("NavigableList-back");
      backBtn.dom.setAttribute("role", "button");
      backBtn.dom.setAttribute("aria-label", "Go back");
      backBtn.dom.tabIndex = 0;
      backBtn.onClick(() => this.navigateBack());
      backBtn.dom.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " " || event.code === "Space") {
          event.preventDefault();
          this.navigateBack();
        }
      });
      headerRow.add(backBtn);
    }

    const title = new UIText(this.getTitle(this.currentData));
    title.addClass("dui-drill-title");
    title.addClass("NavigableList-title");
    headerRow.add(title);

    this.headerContent.add(headerRow);

    this.content.clear();

    const children = this.getChildren(this.currentData);

    if (children.length === 0) {
      const emptyMsg = new UIText(this.emptyMessage);
      emptyMsg.addClass("dui-drill-empty");
      emptyMsg.addClass("NavigableList-empty");
      this.content.add(emptyMsg);
      return;
    }

    children.forEach((child) => {
      this.content.add(this.renderItem(child, this));
    });
  }

  /**
   * @param {Object} item
   * @param {DrillDownUpList} list
   * @returns {UIDiv}
   */
  defaultRenderItem(item, list) {
    const children = this.getChildren(item);
    const hasChildren = children.length > 0;

    const row = new UIDiv();
    row.addClass("dui-drill-item");
    row.addClass("NavigableList-item");
    if (hasChildren) row.addClass("has-children");
    row.dom.setAttribute("role", "listitem");
    row.dom.tabIndex = 0;

    const label = new UIText(this.getLabel(item));
    label.addClass("dui-drill-item-label");
    label.addClass("NavigableList-item-label");
    row.add(label);

    if (hasChildren) {
      const arrow = new UIIcon("chevron_right");
      arrow.addClass("dui-drill-item-chevron");
      arrow.dom.setAttribute("aria-hidden", "true");
      row.add(arrow);
    }

    const activate = () => {
      if (this.onItemClick) this.onItemClick(item, list);
      if (this.autoNavigate && hasChildren) this.navigateTo(item);
    };

    row.onClick(activate);
    row.dom.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " " || event.code === "Space") {
        event.preventDefault();
        activate();
      }
    });

    return row;
  }

  /**
   * @returns {UIDiv}
   */
  getElement() {
    return this.panel;
  }
}

export { DrillDownUpList };
