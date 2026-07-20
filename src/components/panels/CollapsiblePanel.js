import { Icon } from "../../primitives/ui.js";

import { ContentPanel } from "./ContentPanel.js";

/**
 * {@link ContentPanel} with a header collapse toggle.
 *
 * @example
 * const section = new CollapsiblePanel({ title: "Parameters", icon: "tune" });
 * section.content(new TextBlock("Section body"));
 *
 * @category Panels
 */
export class CollapsiblePanel extends ContentPanel {
  /**
   * @param {Object} [options]
   * @param {string} [options.title="Section"]
   * @param {boolean} [options.collapsed=false]
   * @param {string|null} [options.icon=null]
   * @param {string|null} [options.className=null]
   * @param {boolean} [options.showFooter=false]
   * @param {boolean} [options.showHeader=true]
   */
  constructor(options = {}) {
    const {
      title = "Section",
      collapsed = false,
      icon = null,
      className = null,
      showFooter = false,
      showHeader = true,
      resizable = false,
      draggable = false,
      resizeHandles = [],
      panelStyles = {},
      ...rest
    } = options;

    super({
      ...rest,
      title,
      icon,
      showFooter,
      showHeader: false,
      resizable,
      draggable,
      resizeHandles,
      panelStyles: {
        height: "fit-content",
        maxHeight: "none",
        maxWidth: "none",
        overflow: "hidden",
        ...panelStyles,
      },
    });

    this.addClass("CollapsiblePanel");
    if (className) this.addClass(className);

    this._collapsed = Boolean(collapsed);
    this.toggleIcon = new Icon(this._collapsed ? "chevron_right" : "expand_less");
    this.toggleIcon.addClass("CollapsiblePanel-toggle");

    if (showHeader) {
      this.header({
        title,
        icon,
        actions: [this.toggleIcon],
        alwaysActionsColumn: true,
      });
      this._bindCollapseHeader();
    }

    if (this._collapsed) this.collapse();
  }

  /**
   * @private
   */
  _bindCollapseHeader() {
    const el = this._header?.dom;
    if (!el) return;

    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.style.cursor = "pointer";
    el.setAttribute("aria-expanded", String(!this._collapsed));
    this._header.onClick(() => this.toggleCollapse());
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " " || event.code === "Space") {
        event.preventDefault();
        this.toggleCollapse();
      }
    });
  }

  /** @returns {this} */
  collapse() {
    this.addClass("collapsed");
    this._collapsed = true;
    this.toggleIcon.modify("chevron_right");
    this._header?.dom.setAttribute("aria-expanded", "false");
    return this;
  }

  /** @returns {this} */
  expand() {
    this.removeClass("collapsed");
    this._collapsed = false;
    this.toggleIcon.modify("expand_less");
    this._header?.dom.setAttribute("aria-expanded", "true");
    return this;
  }

  /** @returns {this} */
  toggleCollapse() {
    return this._collapsed || this.dom.classList.contains("collapsed")
      ? this.expand()
      : this.collapse();
  }
}
