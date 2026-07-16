import {
  UIPanel,
  UITabbedPanel,
  UIIcon,
  UIDiv,
  UISpan,
  UIButton,
  UIInput,
  UIRow,
} from "../primitives/ui.js";

import { makeResizable, makeDraggable } from "../utils/panel-resizer.js";

// Pin position configurations
const PIN_CONFIGS = {
  left: {
    left: '0', top: '0',
    width: '45vw', height: '100vh'
  },
  bottom: {
    left: '0', bottom: '0',
    width: '100vw', height: '30vh'
  },
  right: {
    right: '0', top: '0',
    width: '45vw', height: '100vh'
  },
  maximized: {
    left: '0', top: '0',
    width: '100vw', height: '100vh'
  }
};

// Default floating position (centered)
const DEFAULT_POSITION = {
  left: '0', top: '0',
  width: '45vw', height: '100vh'
};

/**
 * @extends {UIPanel}
 * @property {{ position: string, tabId: string, hostDom: HTMLElement }|null} _dockedWorkspace
 */
class FloatingPanel extends UIPanel {
  static get isMobile() {
    return window.innerWidth <= 768;
  }

  constructor(options) {
    super();

    this.panelIcon = null;
    this.title = { icon: null, text: null };

    this.isMaximized = false;

    this.isClosed = false;

    this._pinned = null;

    this._onCloseCallback = null;

    this._restoreContainer = options && options.restoreContainer ? options.restoreContainer : null;

    /** @type {boolean} When false, the close button is hidden and the panel cannot be closed. */
    this.closable = options?.closable !== false;

    /**
     * Optional dock-to-workspace handlers: { left?, bottom?, right? } each (panel) => void.
     * When set for a side, that pin button calls the handler instead of CSS pin.
     */
    this._dockHandlers = options?.dock ?? null;

    /**
     * Set by workspacePanelDock when panel body lives in a layout tab; cleared on undock.
     * @type {{ position: string, tabId: string, hostDom: HTMLElement }|null}
     */
    this._dockedWorkspace = null;

    /**
     * When set, dock-from-float restores body into this TabPanel instead of a WorkspaceDockHost wrapper.
     * @type {object|null}
     */
    this._sourceTabPanel = null;
    if (options && options.sourceTabPanel) {
      this._sourceTabPanel = options.sourceTabPanel;
    }

    this.addClass("FloatingPanel");

    this.header = this._buildHeader();

    this._buildContentWrapper();

    if (!FloatingPanel.isMobile) {
      makeResizable(this.dom);
      makeDraggable(this.dom, this.header.dom);
    }

    if (options) this._buildContent(options);

    // Apply common gallery / freeform mount options
    if (options?.width) {
      this.dom.style.width = options.width;
    }
    if (options?.height) {
      this.dom.style.height = options.height;
    }
    if (options?.position === "left" || options?.position === "right" || options?.position === "bottom") {
      this._pinned = options.position;
      this._applyPosition(PIN_CONFIGS[options.position]);
      if (options?.width) this.dom.style.width = options.width;
    }

    this._setupMobileSheet();

  }

  // ==================== Public API ====================

  get content() {
    return this.contentWrapper.dom;
  }

  setTitle(title) {
    this.title.text.dom.textContent = title ?? "";

    return this;
  }

  setIcon(iconName) {
    this.panelIcon = iconName;

    const hasIcon = Boolean(iconName);
    this.title.icon.setHidden(!hasIcon);
    if (hasIcon) {
      this.title.icon.setIcon(iconName);
    }

    return this;
  }

  setContent(content) {
    const docked = this._dockedWorkspace;
    if (docked?.hostDom) {
      const host = docked.hostDom;
      while (host.firstChild) {
        host.removeChild(host.firstChild);
      }
      if (content && (content instanceof Object || content.nodeType)) {
        if (content.nodeType) {
          host.appendChild(content);
        } else if (content.dom) {
          host.appendChild(content.dom);
        }
      }
      return this;
    }

    this.contentWrapper.clear();

    if (content && (content instanceof Object || content.nodeType)) {
      this.contentWrapper.add(content);
    }

    return this;
  }

  addContent(content) {
    const docked = this._dockedWorkspace;
    if (docked?.hostDom && content && (content instanceof Object || content.nodeType)) {
      if (content.nodeType) {
        docked.hostDom.appendChild(content);
      } else if (content.dom) {
        docked.hostDom.appendChild(content.dom);
      }
      return this;
    }

    this.contentWrapper.add(content);

    return this;
  }

  minimize() {
    this.dom.style.display = 'none';

    return this;
  }

  restore() {
    this.dom.style.display = '';

    return this;
  }

  maximize() {
    if (!this.isMaximized) {
      this._toggleMaximize();
    }

    return this;
  }

  unmaximize() {
    if (this.isMaximized) this._toggleMaximize();

    return this;
  }

  pinLeft() {
    this._togglePin('left');

    return this;
  }

  pinBottom() {
    this._togglePin('bottom');

    return this;
  }

  pinRight() {
    this._togglePin('right');

    return this;
  }

  unpin() {
    if (this._pinned || this.isMaximized) {
      this.dom.classList.remove('maximized');

      this._setDefaultPosition();

      this._pinned = null;

      this.isMaximized = false;
    }

    return this;
  }

  /**
   * Pin panel to a custom position
   * @param {Object} options - Position options
   * @param {string} [options.left] - CSS left value (e.g., '100px', '10%')
   * @param {string} [options.top] - CSS top value
   * @param {string} [options.width] - CSS width value
   * @param {string} [options.height] - CSS height value
   */
  pinToPosition({ left, top, width, height } = {}) {
    this._pinned = 'custom';

    this._applyPosition({
      left: left ?? 'calc(50vw - 200px)',
      top: top ?? 'calc(50vh - 150px)',
      width: width ?? '400px',
      height: height ?? '300px'
    });

    return this;
  }

  close() {
    this.dom.remove();

    this.isClosed = true;

    if (this._onCloseCallback) {
      this._onCloseCallback();
    }

    return this;
  }

  /**
   * Set callback to be called when panel is closed
   * @param {Function} callback - Function to call on close
   */
  onClose(callback) {
    this._onCloseCallback = callback;

    return this;
  }

  /**
   * Reopen a closed panel by re-adding to DOM
   * @param {HTMLElement} [container] - Optional container to append to (defaults to document.body)
   */
  reopen(container) {
    if (!this.isClosed) return this;

    const parent = container || document.body;

    parent.appendChild(this.dom);

    this.isClosed = false;

    return this;
  }

  show(container) {
    // If panel was closed (removed from DOM), reopen it
    if (this.isClosed || !this.dom.parentElement) {
      const parent = container || document.body;

      parent.appendChild(this.dom);

      this.isClosed = false;
    }

    this.dom.style.display = '';
    this.dom.style.position = 'fixed';
    this.dom.style.zIndex = '10060';

    if (!this.dom.style.left && !this.dom.style.right) {
      this.dom.style.right = '16px';
      this.dom.style.top = '16px';
      this.dom.style.left = 'auto';
    }

    return this;
  }

  /**
  * Attach to the layout floating layer (typically #World) and sync geometry.
   * @param {HTMLElement} containerElement
   * @returns {this}
   */
  mountFloating(containerElement) {
    if (!containerElement || !(containerElement instanceof HTMLElement)) {
      return this;
    }

    const isNewMount = !this.dom.parentElement;
    containerElement.appendChild(this.dom);

    this.isClosed = false;

    this.dom.style.display = '';

    // Without initial geometry an absolutely-positioned panel stays in document
    // flow (possibly below the fold on overflow-hidden hosts). Match show().
    if (isNewMount && !this.dom.style.left && !this.dom.style.right) {
      this.dom.style.right = '16px';
      this.dom.style.top = '16px';
      this.dom.style.left = 'auto';
    }

    this.prepareAfterRemount();

    if (isNewMount) {
      this.dom.classList.remove('is-entering');
      void this.dom.offsetWidth;
      this.dom.classList.add('is-entering');
      this.dom.addEventListener('animationend', () => {
        this.dom.classList.remove('is-entering');
      }, { once: true });
    }

    return this;
  }

  /**
   * After the panel was re-attached (e.g. undock from workspace), sync left/top to the
   * new offset parent so absolute positioning + drag match the visible box.
   * @returns {this}
   */
  prepareAfterRemount() {
    if (FloatingPanel.isMobile) return this;

    this.dom.classList.remove("maximized");
    this.isMaximized = false;
    this._pinned = null;

    void this.dom.offsetWidth;

    const rect = this.dom.getBoundingClientRect();
    const op = this.dom.offsetParent;

    this.dom.style.right = "";
    this.dom.style.bottom = "";

    if (op instanceof HTMLElement) {
      const pr = op.getBoundingClientRect();
      this.dom.style.left = `${Math.round(rect.left - pr.left + op.scrollLeft)}px`;
      this.dom.style.top = `${Math.round(rect.top - pr.top + op.scrollTop)}px`;
    } else {
      this.dom.style.left = `${Math.round(rect.left)}px`;
      this.dom.style.top = `${Math.round(rect.top)}px`;
    }

    if (rect.width > 0) this.dom.style.width = `${Math.round(rect.width)}px`;
    if (rect.height > 0) this.dom.style.height = `${Math.round(rect.height)}px`;

    return this;
  }

  hide() {
    this.dom.style.display = 'none';

    return this;
  }

  // ==================== Private Build Methods ====================

  _buildHeader() {
    const header = new UIDiv()
      .addClass("Row")
      .addClass("FloatingPanel-header")
      .addClass("PanelHeader");

    this.add(header);

    const titleRow = new UIRow().setStyles({
      alignItems: "center",
      flex: "1 1 auto",
      gap: "0.5rem",
      minWidth: "0",
    });

    this.title.icon = new UIIcon("");
    this.title.icon.setHidden(true);
    this.title.icon.setStyle("font-size", ["1.2rem"]);

    this.title.text = new UISpan();
    this.title.text.setStyles({
      fontSize: "0.9rem",
      fontWeight: "600",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });

    titleRow.add(this.title.icon, this.title.text);
    header.add(titleRow);

    const tools = new UIRow().setStyles({
      alignItems: "center",
      flexShrink: "0",
      gap: "0.25rem",
      justifyContent: "flex-end",
    });
    tools.addClass("FloatingPanel-tools");

    tools.add(this._createHeaderButton("left_panel_open", () => this._togglePin("left"), "Dock left"));
    tools.add(this._createHeaderButton("bottom_panel_open", () => this._togglePin("bottom"), "Dock bottom"));
    tools.add(this._createHeaderButton("right_panel_open", () => this._togglePin("right"), "Dock right"));
    tools.add(this._createHeaderButton("open_in_full", () => this._toggleMaximize(), "Maximize"));

    if (this.closable) {
      tools.add(this._createHeaderButton("close", () => this.close(), "Close"));
    }

    header.add(tools);

    return header;
  }

  _buildContentWrapper() {
    this.contentWrapper = new UIDiv().addClass("fill-height").addClass("FloatingPanel-content");

    this.add(this.contentWrapper);
  }

  _createHeaderButton(iconName, onClick, tooltip = "") {
    const button = new UIIcon(iconName);
    button.addClass("Operator");
    button.addClass("FloatingPanel-tool");
    button.dom.title = tooltip;
    button.setStyle("font-size", ["1rem"]);
    button.dom.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });

    return button;
  }

  // ==================== Private Position Methods ====================

  /**
   * Clear all positioning styles to prevent conflicts
   */
  _clearPositioning() {
    this.dom.style.left = '';

    this.dom.style.right = '';

    this.dom.style.top = '';

    this.dom.style.bottom = '';

    this.dom.style.width = '';

    this.dom.style.height = '';
  }

  /**
   * Apply position config (clears existing first to prevent conflicts)
   */
  _applyPosition(config) {
    if (FloatingPanel.isMobile) return;
    this._clearPositioning();

    Object.entries(config).forEach(([k, v]) => {
      this.dom.style[k] = v;
    });
  }

  _setupMobileSheet() {
    if (!FloatingPanel.isMobile) return;
    this.dom.style.cssText = '';
    this.header.dom.style.cursor = 'pointer';
    this.header.dom.addEventListener('click', () => {
      this.dom.classList.toggle('sheet-expanded');
    });
  }

  /**
   * Set to default floating position (centered)
   */
  _setDefaultPosition() {
    this._applyPosition(DEFAULT_POSITION);
  }

  // ==================== Private Toggle Methods ====================

  _togglePin(position) {
    const dockFn = this._dockHandlers?.[position];
    if (dockFn) {
      dockFn(this);
      return;
    }

    // If clicking same pin, unpin to default position
    if (this._pinned === position) {
      this.dom.classList.remove('maximized');

      this._setDefaultPosition();

      this._pinned = null;

      this.isMaximized = false;

      return;
    }

    // Clear maximized state
    if (this.isMaximized) {
      this.dom.classList.remove('maximized');

      this.isMaximized = false;
    }

    this._pinned = position;

    this._applyPosition(PIN_CONFIGS[position]);
  }

  _toggleMaximize() {
    if (this.isMaximized) {
      this.dom.classList.remove("maximized");

      this._setDefaultPosition();

      this._pinned = null;

      this.isMaximized = false;
    } else {

      this.dom.classList.add("maximized");

      this._applyPosition(PIN_CONFIGS.maximized);

      this._pinned = null;

      this.isMaximized = true;
    }

  }

  _getPanelContainer() {
    if (this._restoreContainer) return this._restoreContainer;
    const worldContainer = document.getElementById('World');
    if (worldContainer) return worldContainer;
    return document.body;
  }

  // ==================== Content Building ====================

  _buildContent(options) {
    if (options.title) this.setTitle(options.title);

    if (options.icon) this.setIcon(options.icon);

    if (options.input) {
      const input = new UIInput(options.input.defaultValue || "");
      /** @type {HTMLInputElement} */ (input.dom).placeholder = options.input.placeholder;

      this.input = input;

      this.contentWrapper.add(input);
    }

    if (options.fileInput) {
      const fileInput = new UIInput();

      /** @type {HTMLInputElement} */ (fileInput.dom).type = "file";

      /** @type {HTMLInputElement} */ (fileInput.dom).accept = options.fileInput.accept || "";

      this.fileInput = fileInput;

      this.contentWrapper.add(fileInput);
    }

    if (options.panel) {
      const tabbedPanel = new UITabbedPanel();

      for (const tab of options.panel.tabs) {
        const tabContent = new UIPanel();

        for (const element of tab.content) {
          tabContent.add(element);
        }

        tabbedPanel.addTab(tab.title, tabContent);
      }

      this.contentWrapper.add(tabbedPanel);
    }

    if (options.content) {
      this.contentWrapper.add(options.content);
    }

    if (options.confirm || options.cancel) {
      const buttonContainer = new UIPanel();

      buttonContainer.dom.style.display = "flex";

      buttonContainer.dom.style.gap = "var(--spacing-md)";

      buttonContainer.dom.style.justifyContent = "flex-end";

      if (options.confirm) {
        const confirmButton = new UIButton(options.confirm.text);

        confirmButton.onClick(() => {
          let value = null;
          if (this.input) {
            value = this.input.getValue();
          } else if (this.fileInput && this.fileInput.dom) {
            const fileInputElement = /** @type {HTMLInputElement} */ (this.fileInput.dom);
            value = fileInputElement.files && fileInputElement.files[0] ? fileInputElement.files[0] : null;
          }

          options.confirm.onClick(value);

          this.close();
        });

        buttonContainer.add(confirmButton);
      }

      if (options.cancel) {
        const cancelButton = new UIButton(options.cancel.text);

        cancelButton.onClick(() => this.close());

        buttonContainer.add(cancelButton);
      }

      this.add(buttonContainer);
    }
  }

}

export { FloatingPanel };
