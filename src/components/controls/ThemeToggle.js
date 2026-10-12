import { Control, InputText, Text } from "../../primitives/ui.js";

/**
 * Light/dark switch. Sets `data-theme` on `<html>` to `"light"` or `"dark"`,
 * which is what the package stylesheets read.
 *
 * @example
 * const toggle = new ThemeToggle({
 *   theme: "dark",
 *   onChange(theme) {
 *     console.log(theme);
 *   },
 * });
 *
 * @category Inputs
 */
class ThemeToggle extends Control {
  /**
   * @param {{ theme?: "light"|"dark", onChange?: (theme: "light"|"dark") => void }} [options]
   */
  constructor(options = {}) {
    super(document.createElement("label"));

    const { theme = "dark", onChange = null } = options;
    this._onChange = typeof onChange === "function" ? onChange : null;

    this.dom.className = "ThemeToggle";
    this.dom.htmlFor = "theme-toggle";

    const toggleWrap = new Text();
    toggleWrap.dom.className = "ThemeToggle-wrap";

    this.toggle = new InputText();
    this.toggle.dom.id = "theme-toggle";
    this.toggle.dom.className = "ThemeToggle-input";
    this.toggle.dom.type = "checkbox";
    this.toggle.dom.role = "switch";
    this.toggle.dom.name = "theme";
    this.toggle.dom.value = "dark";

    const icon = new Text();
    icon.dom.className = "ThemeToggle-icon";

    for (let i = 0; i < 9; i++) {
      const iconPart = new Text();
      iconPart.dom.className = "ThemeToggle-part";
      icon.add(iconPart);
    }

    this.add(toggleWrap);
    toggleWrap.add(this.toggle);
    toggleWrap.add(icon);

    this.dom.addEventListener("change", () => {
      const next = this.getValue() ? "dark" : "light";
      this._apply(next);
      this._onChange?.(next);
    });

    this.setTheme(theme, false);
  }

  /**
   * @param {"light"|"dark"} theme
   * @param {boolean} [notify=true]
   * @returns {this}
   */
  setTheme(theme, notify = true) {
    const next = theme === "light" ? "light" : "dark";
    this._apply(next);
    if (notify) this._onChange?.(next);
    return this;
  }

  /** @returns {"light"|"dark"} */
  getTheme() {
    return this.getValue() ? "dark" : "light";
  }

  /**
   * @param {"light"|"dark"} theme
   * @private
   */
  _apply(theme) {
    this.setValue(theme === "dark");
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = theme;
    }
  }

  getValue() {
    return this.toggle.dom.checked;
  }

  setValue(value) {
    this.toggle.dom.checked = value;
  }
}

export { ThemeToggle };
export default ThemeToggle;
