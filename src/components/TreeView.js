import {
  UIIcon,
  UIDiv,
  UIText,
} from "../primitives/ui.js";
import { createHierarchicalListOptions } from "../utils/hierarchical-list-options.js";

/**
 * Expandable nested tree for hierarchical data.
 *
 * Shares the same options shape as DrillDownUpList (`getChildren`, `getLabel`,
 * `onItemClick`, `renderItem`) so the same `{ name, children }` trees work for both.
 */
class TreeView {
  /**
   * @param {Object} [options={}]
   * @param {Function|null} [options.onItemClick] - (item, tree) => void
   * @param {Function|null} [options.onToggle] - (item, expanded, tree) => void
   * @param {Function} [options.renderItem] - (item, tree, depth) => UIElement
   * @param {Function} [options.getChildren] - (item) => array
   * @param {Function} [options.getLabel] - (item) => string
   * @param {Function} [options.getId] - (item) => string|number — stable id for selection/expand
   * @param {Function} [options.isExpanded] - (item) => boolean — initial expand state
   * @param {boolean} [options.expandRoot=true] - Expand root children on first render
   * @param {string} [options.emptyMessage]
   */
  constructor(options = {}) {
    this.rootData = null;
    this.selectedId = null;
    this.expandedIds = new Set();

    const defaults = createHierarchicalListOptions(options);
    this.onItemClick = defaults.onItemClick;
    this.onToggle = options.onToggle || null;
    this.renderItem = options.renderItem || this.defaultRenderItem.bind(this);
    this.getChildren = defaults.getChildren;
    this.getLabel = defaults.getLabel;
    this.getId =
      options.getId ||
      ((item) => item.id ?? item.name ?? item.label ?? String(item));
    this.isExpanded = options.isExpanded || null;
    this.expandRoot = options.expandRoot !== false;
    this.emptyMessage = defaults.emptyMessage;

    this.panel = new UIDiv();
    this.panel.addClass("dui-tree");
    this.panel.dom.setAttribute("role", "tree");

    this.content = new UIDiv();
    this.content.addClass("dui-tree-content");
    this.panel.add(this.content);
  }

  /**
   * @param {Object|Object[]} data - Root node or array of root nodes
   */
  setData(data) {
    this.rootData = data;
    this.expandedIds.clear();
    this.selectedId = null;

    const roots = this._roots();
    roots.forEach((item) => {
      const id = this.getId(item);
      const shouldExpand =
        this.isExpanded?.(item) ??
        (this.expandRoot && this.getChildren(item).length > 0);
      if (shouldExpand) this.expandedIds.add(id);
    });

    this.refresh();
    return this;
  }

  /**
   * @param {Object} item
   * @param {boolean} [expanded]
   */
  setExpanded(item, expanded = true) {
    const id = this.getId(item);
    if (expanded) this.expandedIds.add(id);
    else this.expandedIds.delete(id);
    this.refresh();
    if (this.onToggle) this.onToggle(item, expanded, this);
    return this;
  }

  toggle(item) {
    const id = this.getId(item);
    return this.setExpanded(item, !this.expandedIds.has(id));
  }

  /**
   * @param {Object|null} item
   */
  setSelected(item) {
    this.selectedId = item == null ? null : this.getId(item);
    this.refresh();
    return this;
  }

  refresh() {
    this.content.clear();

    const roots = this._roots();
    if (roots.length === 0) {
      const empty = new UIText(this.emptyMessage);
      empty.addClass("dui-tree-empty");
      this.content.add(empty);
      return this;
    }

    roots.forEach((item) => this._renderNode(item, 0, this.content));
    return this;
  }

  _roots() {
    if (!this.rootData) return [];
    return Array.isArray(this.rootData) ? this.rootData : [this.rootData];
  }

  /**
   * @param {Object} item
   * @param {number} depth
   * @param {UIDiv} parent
   */
  _renderNode(item, depth, parent) {
    parent.add(this.renderItem(item, this, depth));

    const children = this.getChildren(item);
    const id = this.getId(item);
    if (children.length === 0 || !this.expandedIds.has(id)) return;

    const group = new UIDiv();
    group.addClass("dui-tree-children");
    group.dom.setAttribute("role", "group");
    children.forEach((child) => this._renderNode(child, depth + 1, group));
    parent.add(group);
  }

  /**
   * @param {Object} item
   * @param {TreeView} tree
   * @param {number} depth
   * @returns {UIDiv}
   */
  defaultRenderItem(item, tree, depth) {
    const children = this.getChildren(item);
    const hasChildren = children.length > 0;
    const id = this.getId(item);
    const expanded = this.expandedIds.has(id);
    const selected = this.selectedId != null && this.selectedId === id;

    const row = new UIDiv();
    row.addClass("dui-tree-item");
    if (hasChildren) row.addClass("has-children");
    if (expanded) row.addClass("is-expanded");
    if (selected) row.addClass("is-selected");
    row.dom.style.setProperty("--dui-tree-depth", String(depth));
    row.dom.setAttribute("role", "treeitem");
    if (hasChildren) row.dom.setAttribute("aria-expanded", String(expanded));
    row.dom.setAttribute("aria-selected", String(selected));
    row.dom.tabIndex = 0;

    const toggle = new UIDiv();
    toggle.addClass("dui-tree-toggle");
    if (hasChildren) {
      const icon = new UIIcon(expanded ? "expand_more" : "chevron_right");
      icon.dom.setAttribute("aria-hidden", "true");
      toggle.add(icon);
      toggle.dom.setAttribute("role", "button");
      toggle.dom.setAttribute("aria-label", expanded ? "Collapse" : "Expand");
      toggle.onClick((event) => {
        event.stopPropagation();
        this.toggle(item);
      });
    } else {
      toggle.addClass("is-leaf");
      toggle.dom.setAttribute("aria-hidden", "true");
    }
    row.add(toggle);

    const label = new UIText(this.getLabel(item));
    label.addClass("dui-tree-label");
    row.add(label);

    const select = () => {
      this.setSelected(item);
      if (this.onItemClick) this.onItemClick(item, tree);
    };

    row.onClick((event) => {
      if (event.target.closest(".dui-tree-toggle")) return;
      select();
    });

    row.dom.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " " || event.code === "Space") {
        event.preventDefault();
        select();
      } else if (event.key === "ArrowRight" && hasChildren && !expanded) {
        event.preventDefault();
        this.setExpanded(item, true);
      } else if (event.key === "ArrowLeft" && hasChildren && expanded) {
        event.preventDefault();
        this.setExpanded(item, false);
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

export { TreeView };
