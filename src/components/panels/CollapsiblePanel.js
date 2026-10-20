import { Text } from "../../primitives/ui.js";

import { Panel } from "./Panel.js";

/**
 * {@link Panel} with a header collapse toggle.
 *
 * @example
 * const section = new CollapsiblePanel({ title: "Parameters", icon: "tune" });
 * section.content(new Text("Section body"));
 *
 * @example <caption>Header actions</caption>
 * const filter = new Operator("filter_alt");
 * const section = new CollapsiblePanel({ title: "Properties", actions: [filter] });
 *
 * @category Panels
 */
export class CollapsiblePanel extends Panel {
  /**
   * @param {Object} [options]
   * @param {string} [options.title="Section"]
   * @param {boolean} [options.collapsed=false]
   * @param {string|null} [options.icon=null]
   * @param {string|null} [options.className=null]
   * @param {boolean} [options.showFooter=false]
   * @param {boolean} [options.showHeader=true]
   * @param {import('../../primitives/ui.js').Control[]} [options.actions] Header controls on the right. Clicking them does not collapse the panel.
   */
  constructor(options = {}) {
    const {
      title = "Section",
      collapsed = false,
      icon = null,
      className = null,
      showFooter = false,
      showHeader = true,
      actions = [],
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
    this.toggleIcon = new Text(this._collapsed ? "▸" : "▾");
    this.toggleIcon.addClass("CollapsiblePanel-toggle");

    if (showHeader) {
      this.header({
        title,
        icon,
        actions,
        leadingActions: [this.toggleIcon],
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
    el.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest(".Header-actions")) return;
      this.toggleCollapse();
    });
    el.addEventListener("keydown", (event) => {
      if (event.target !== el) return;
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
    this.toggleIcon?.setValue("▸");
    this._header?.dom.setAttribute("aria-expanded", "false");
    return this;
  }

  /** @returns {this} */
  expand() {
    this.removeClass("collapsed");
    this._collapsed = false;
    this.toggleIcon?.setValue("▾");
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
