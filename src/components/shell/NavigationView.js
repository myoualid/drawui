import { Container, Icon, Caption, StackPanel, TextBlock } from "../../primitives/ui.js";
import { ScrollViewer } from "../../primitives/ui.js";
import { makeFlexResizer } from "../../utils/flexResizer.js";

/**
 * @typedef {{ width?: string, minWidth?: string, maxWidth?: string }} SidebarSizeOptions
 * @category Shell
 */
class NavigationView extends Container {
  constructor(options = {}) {
    super();

    const {
      className = "",
      sidebarClassName = "",
      mainClassName = "",
      sidebarHeaderClassName = "",
      sidebarBodyClassName = "",
      sidebarFooterClassName = "",
      sidebarVisible = true,
      sidebarWidth = "240px",
      sidebarMinWidth = "180px",
      sidebarMaxWidth = "280px",
      sidebarBorder = true,
      sidebarResizable = true,
    } = options;

    this.sidebarVisible = Boolean(sidebarVisible);
    this.sidebarResizable = Boolean(sidebarResizable);
    this.sidebarResizer = null;
    this._cleanupSidebarResizer = null;
    this._sidebarToggleButtons = new Map();
    this._sidebarVisibilityListeners = new Set();

    this.setClass("NavigationView");

    if (className) {
      this.addClass(className);
    }

    this.sidebar = new Container();
    this.sidebar.setClass("SideBar");

    if (sidebarClassName) {
      this.sidebar.addClass(sidebarClassName);
    }

    if (!sidebarBorder) {
      this.sidebar.addClass("SideBar-borderless");
    }

    this.sidebarHeader = new Container();
    this.sidebarHeader.setClass("SideBar-header");

    if (sidebarHeaderClassName) {
      this.sidebarHeader.addClass(sidebarHeaderClassName);
    }

    this.sidebarFooter = new Container();
    this.sidebarFooter.setClass("SideBar-footer");

    if (sidebarFooterClassName) {
      this.sidebarFooter.addClass(sidebarFooterClassName);
    }

    this.main = new Container();
    this.main.setClass("MainPanel");

    if (mainClassName) {
      this.main.addClass(mainClassName);
    }

    this.sidebarTitleRow = new StackPanel({ isVertical: false });
    this.sidebarTitleRow.addClass("SideBar-titleRow");

    this.sidebarTitle = new TextBlock("");
    this.sidebarTitle.setClass("Title");

    this.mainHeader = new StackPanel({ isVertical: false });
    this.mainHeader.addClass("MainPanel-header");
    this.mainHeader.addClass("justify-between");

    this.mainHeaderContent = new Container();
    this.mainHeaderContent.setStyle("display", ["flex"]);
    this.mainHeaderContent.setStyle("flex", ["1 1 auto"]);
    this.mainHeaderContent.setStyle("minWidth", ["0"]);

    this.sidebarBody = new ScrollViewer({
      className: sidebarBodyClassName,
      scrollable: true,
    });
    this.mainBody = new ScrollViewer();

    this.sidebarToggleButton = this.createSidebarToggleButton({
      visibleTitle: "Hide sidebar",
      hiddenTitle: "Show sidebar",
    });
    this.sidebarToggleButton.addClass("SideBar-toggle");
    this.mainSidebarToggleButton = this.sidebarToggleButton;

    this.sidebarTitleRow.add(this.sidebarToggleButton, this.sidebarTitle);
    this.sidebarHeader.add(this.sidebarTitleRow);

    this.mainHeader.add(this.mainHeaderContent);

    this.sidebar.add(this.sidebarHeader, this.sidebarBody, this.sidebarFooter);
    this.main.add(this.mainHeader, this.mainBody);

    if (this.sidebarResizable) {
      this._setupSidebarResizer();
    } else {
      this.add(this.sidebar, this.main);
    }

    this.setSidebarSize({
      width: sidebarWidth,
      minWidth: sidebarMinWidth,
      maxWidth: sidebarMaxWidth,
    });
    this.setSidebarTitle("");
    this.setSidebarVisible(this.sidebarVisible);
  }

  setSidebarVisible(visible) {
    this.sidebarVisible = Boolean(visible);
    this._syncSidebarTogglePlacement();
    this.toggleClass("is-sidebar-hidden", !this.sidebarVisible);
    this._syncSidebarResizer();
    this._syncSidebarToggleButtons();

    for (const listener of this._sidebarVisibilityListeners) {
      listener(this.sidebarVisible);
    }

    return this;
  }

  toggleSidebar() {
    return this.setSidebarVisible(!this.sidebarVisible);
  }

  isSidebarVisible() {
    return this.sidebarVisible;
  }

  onSidebarVisibilityChange(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }

    this._sidebarVisibilityListeners.add(listener);

    return () => {
      this._sidebarVisibilityListeners.delete(listener);
    };
  }

  setSidebarTitle(text = "") {
    const nextTitle = String(text || "").trim();

    this.sidebarTitle.setValue(nextTitle);
    this.sidebarTitle.dom.hidden = !nextTitle;

    return this.sidebarTitle;
  }

  _syncSidebarTogglePlacement() {
    if (!this.sidebarToggleButton || !this.sidebarToggleButton.dom) {
      return;
    }

    if (this.sidebarVisible) {
      this.sidebarTitleRow.dom.insertBefore(
        this.sidebarToggleButton.dom,
        this.sidebarTitle.dom
      );

      return;
    }

    this.mainHeader.dom.insertBefore(
      this.sidebarToggleButton.dom,
      this.mainHeaderContent.dom
    );
  }

  _syncSidebarToggleButton(button, options) {
    if (!button || !button.dom) {
      return;
    }

    const visibleTitle = options?.visibleTitle || "Hide sidebar";
    const hiddenTitle = options?.hiddenTitle || "Show sidebar";
    const title = this.sidebarVisible ? visibleTitle : hiddenTitle;

    button.dom.title = title;
    button.dom.setAttribute("aria-label", title);
    button.dom.setAttribute("aria-pressed", String(this.sidebarVisible));
    button.toggleClass("Active", this.sidebarVisible);
  }

  _syncSidebarToggleButtons() {
    for (const [button, options] of this._sidebarToggleButtons.entries()) {
      this._syncSidebarToggleButton(button, options);
    }
  }

  connectSidebarToggleButton(button, options = {}) {
    if (!button) {
      return button;
    }

    const settings = {
      visibleTitle: options.visibleTitle || "Hide sidebar",
      hiddenTitle: options.hiddenTitle || "Show sidebar",
      onToggle: typeof options.onToggle === "function" ? options.onToggle : null,
      stopPropagation: options.stopPropagation !== false,
    };

    this._sidebarToggleButtons.set(button, settings);
    this._syncSidebarToggleButton(button, settings);

    button.onClick((event) => {
      if (settings.stopPropagation && event) {
        event.stopPropagation();
      }

      const nextVisible = !this.sidebarVisible;

      this.setSidebarVisible(nextVisible);

      if (settings.onToggle) {
        settings.onToggle(nextVisible, event);
      }
    });

    return button;
  }

  createSidebarToggleButton(options = {}) {
    const button = new Container();
    button.setClass("Operator");
    button.add(new Icon(options.icon || "dock_to_left"));

    return this.connectSidebarToggleButton(button, options);
  }

  _setupSidebarResizer() {
    if (this._cleanupSidebarResizer) {
      this._cleanupSidebarResizer();
      this._cleanupSidebarResizer = null;
    }

    this.sidebarResizer = new Container();
    this.sidebarResizer.setClass("layout-resizer layout-resizer-right");
    this.sidebarResizer.dom.setAttribute("role", "separator");
    this.sidebarResizer.dom.setAttribute("aria-orientation", "vertical");
    this.sidebarResizer.dom.setAttribute("aria-label", "Resize sidebar");

    this.clear();
    this.add(this.sidebar, this.sidebarResizer, this.main);

    this._cleanupSidebarResizer = makeFlexResizer({
      resizer: this.sidebarResizer.dom,
      leading: this.sidebar.dom,
      container: this.dom,
      placement: "right",
      cssVariable: "--dui-sidebar-width",
      minCssVariable: "--dui-sidebar-min-width",
      maxCssVariable: "--dui-sidebar-max-width",
    });

    this._syncSidebarResizer();
  }

  _syncSidebarResizer() {
    if (!this.sidebarResizer || !this.sidebarResizer.dom) {
      return;
    }

    this.sidebarResizer.dom.hidden = !this.sidebarVisible;
  }

  setSidebarResizable(enabled) {
    const next = Boolean(enabled);

    if (next === this.sidebarResizable) {
      return this;
    }

    this.sidebarResizable = next;

    if (this._cleanupSidebarResizer) {
      this._cleanupSidebarResizer();
      this._cleanupSidebarResizer = null;
    }

    this.sidebarResizer = null;
    this.clear();

    if (this.sidebarResizable) {
      this._setupSidebarResizer();
    } else {
      this.add(this.sidebar, this.main);
    }

    return this;
  }

  /**
   * @param {SidebarSizeOptions} [options]
   */
  setSidebarSize({ width, minWidth, maxWidth } = {}) {
    if (width != null) {
      this.dom.style.setProperty("--dui-sidebar-width", width);
    }

    if (minWidth != null) {
      this.dom.style.setProperty("--dui-sidebar-min-width", minWidth);
    }

    if (maxWidth != null) {
      this.dom.style.setProperty("--dui-sidebar-max-width", maxWidth);
    }

    return this;
  }

  setSidebarHeader(content) {
    this.sidebarHeader.clear();
    this.sidebarHeader.add(this.sidebarTitleRow);

    if (content) {
      this.sidebarHeader.add(content);
    }

    return this;
  }

  appendSidebarHeader(...content) {
    this.sidebarHeader.add(...content);

    return this;
  }

  setSidebarContent(content) {
    this.sidebarBody.clear();

    if (content) {
      this.sidebarBody.add(content);
    }

    return this;
  }

  appendSidebar(...content) {
    this.sidebarBody.add(...content);

    return this;
  }

  setSidebarFooter(content) {
    this.sidebarFooter.clear();

    if (content) {
      this.sidebarFooter.add(content);
    }

    return this;
  }

  appendSidebarFooter(...content) {
    this.sidebarFooter.add(...content);

    return this;
  }

  setMainHeader(content) {
    this.mainHeaderContent.clear();

    if (content) {
      this.mainHeaderContent.add(content);
    }

    return this;
  }

  appendMainHeader(...content) {
    this.mainHeaderContent.add(...content);

    return this;
  }

  setMainContent(content) {
    this.mainBody.clear();

    if (content) {
      this.mainBody.add(content);
    }

    return this;
  }

  appendMain(...content) {
    this.mainBody.add(...content);

    return this;
  }
}

export { NavigationView };