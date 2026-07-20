import { StackPanel, Icon, TextBlock, Button, Container } from "../../primitives/ui.js";

const TOAST_ICONS = {
  success: "check_circle",
  warning: "warning",
  error: "error",
  info: "info",
};

/**
 * Transient notification or progress overlay.
 *
 * Notification:
 * ```js
 * new Toast("Changes saved", "success");
 * ```
 *
 * Progress:
 * ```js
 * const toast = new Toast();
 * toast.show("#host", "Exporting…");
 * toast.update(50, "50%");
 * toast.hide();
 * ```
 *
 * @category Panels
 */
export class Toast extends StackPanel {
  /**
   * @param {string|{ initialText?: string, indeterminate?: boolean }} [messageOrOptions]
   * @param {'info'|'success'|'warning'|'error'} [type='info']
   * @param {{ duration?: number, dismissible?: boolean, autoMount?: boolean }} [options={}]
   */
  constructor(messageOrOptions, type = "info", options = {}) {
    super({ isVertical: false });

    this._mode = "progress";
    this._visible = false;
    this._usingExistingElement = false;
    this._fillElement = null;
    this._progressRoot = null;
    this._host = null;
    this._textElement = null;
    this._barElement = null;

    if (messageOrOptions && typeof messageOrOptions === "object") {
      this._initProgress(messageOrOptions);
      return;
    }

    if (typeof messageOrOptions === "string") {
      this._initNotification(messageOrOptions, type, options);
      return;
    }

    this._initProgress({});
  }

  /**
   * @param {{ initialText?: string, indeterminate?: boolean }} [options={}]
   */
  _initProgress(options = {}) {
    this._mode = "progress";
    this._initialText = options.initialText ?? "Loading...";
    this._indeterminate = options.indeterminate ?? false;

    this.addClass("Toast");
    this.addClass("Toast--progress");
    this.dom.style.display = "none";
  }

  /**
   * @param {string} message
   * @param {'info'|'success'|'warning'|'error'} [type='info']
   * @param {{ duration?: number, dismissible?: boolean, autoMount?: boolean }} [options={}]
   */
  _initNotification(message, type = "info", options = {}) {
    this._mode = "notification";

    const duration = options.duration ?? 5000;
    const dismissible = options.dismissible ?? true;
    const autoMount = options.autoMount ?? true;

    this.addClass("Toast");
    if (type) this.addClass(`Toast--${type}`);

    this.add(new Icon(TOAST_ICONS[type] || "info"));

    this._textElement = new TextBlock();
    this._textElement.dom.textContent = message;
    this.add(this._textElement);

    if (dismissible) {
      const close = new Button("");
      close.dom.type = "button";
      close.setClass("Toast-close");
      close.add(new Icon("close"));
      close.onClick(() => this.hide());
      this.add(close);
    }

    if (autoMount) {
      this.show();
    }

    if (duration > 0) {
      setTimeout(() => {
        this.dom.classList.add("Toast--fade-out");
        setTimeout(() => this.hide(), 300);
      }, duration);
    }
  }

  /**
   * @param {string} [targetSelector='body']
   * @returns {HTMLElement}
   */
  _resolveHost(targetSelector = "body") {
    if (typeof targetSelector !== "string") {
      return targetSelector?.dom || targetSelector || document.body;
    }
    return document.querySelector(targetSelector) || document.body;
  }

  /**
   * Show the toast. For progress mode, mounts a progress overlay into the target.
   * @param {string|HTMLElement|import('../../primitives/ui.js').Control} [target='body']
   * @param {string} [text]
   * @param {boolean} [isIndeterminate]
   * @returns {Toast}
   */
  show(target = "body", text, isIndeterminate) {
    if (this._mode === "notification") {
      if (typeof document !== "undefined" && document.body && !this.dom.parentNode) {
        document.body.appendChild(this.dom);
      }
      this._visible = true;
      return this;
    }

    const label = text ?? this._initialText;
    const indeterminate = isIndeterminate ?? this._indeterminate;
    const host = this._resolveHost(target);

    if (host.classList?.contains("status-bar")) {
      this._usingExistingElement = true;
      this._progressRoot = host;
      this._host = host;
      this._fillElement = host.querySelector(".status-bar-fill");

      if (!this._fillElement) {
        this._fillElement = new Container().addClass("status-bar-fill").dom;
        host.insertBefore(this._fillElement, host.firstChild);
      }

      const statusText = host.querySelector("#status1") || host.querySelector(".status-progress-percent");
      if (statusText) statusText.textContent = label;
      this._fillElement.style.width = "0%";
      this._visible = true;
      return this;
    }

    if (!this._progressRoot) {
      const isTargetBody = host === document.body;
      const container = new Container().addClass(
        isTargetBody ? "progress-container" : "progress-container progress-container-inline",
      );
      const wrapper = new Container().addClass("progress-wrapper");
      const bar = new Container()
        .addClass(`progress-bar${indeterminate ? " indeterminate" : ""}`)
        .setId("progress-bar");
      const fill = new Container().addClass("progress-fill");
      const textElement = new TextBlock(label || "Loading...");
      textElement.addClass("progress-text");

      fill.add(textElement);
      bar.add(fill);
      wrapper.add(bar);
      container.add(wrapper);

      this._progressRoot = container.dom;
      this._fillElement = fill.dom;
      this._barElement = bar.dom;
      this._textElement = textElement;
    } else if (this._textElement) {
      this._textElement.dom.textContent = label || "Loading...";
      if (this._barElement) {
        this._barElement.classList.toggle("indeterminate", Boolean(indeterminate));
      }
    }

    if (this._progressRoot.parentNode !== host) {
      host.appendChild(this._progressRoot);
    }

    this._host = host;
    this._usingExistingElement = false;
    this._visible = true;
    return this;
  }

  /**
   * Update progress percentage and optional label (progress mode).
   * @param {number} percentage
   * @param {string} [text='']
   * @returns {Toast}
   */
  update(percentage, text = "") {
    if (this._mode === "notification") {
      if (this._textElement && text) {
        this._textElement.dom.textContent = text;
      }
      return this;
    }

    if (!this._visible) {
      this.show();
    }

    if (this._usingExistingElement) {
      if (this._fillElement) {
        this._fillElement.style.width = `${percentage}%`;
      }
      const statusText =
        this._progressRoot?.querySelector("#status1") ||
        this._progressRoot?.querySelector(".status-progress-percent");
      if (statusText) {
        statusText.textContent = text || `${percentage}%`;
      }
      return this;
    }

    if (this._barElement && this._fillElement) {
      this._barElement.classList.remove("indeterminate");
      this._fillElement.style.width = `${percentage}%`;
    }

    if (this._textElement) {
      this._textElement.dom.textContent = text || `${percentage}%`;
    }

    return this;
  }

  /**
   * Hide / dismiss the toast.
   * @returns {Toast}
   */
  hide() {
    if (this._mode === "notification") {
      this.dom.remove();
      this._visible = false;
      return this;
    }

    if (!this._visible && !this._progressRoot) {
      return this;
    }

    if (this._usingExistingElement) {
      if (this._fillElement) {
        this._fillElement.style.width = "0%";
      }
      const statusText = this._progressRoot?.querySelector("#status1");
      if (statusText) statusText.textContent = "";
      this._fillElement = null;
      this._progressRoot = null;
      this._usingExistingElement = false;
      this._visible = false;
      return this;
    }

    if (this._progressRoot?.parentNode) {
      this._progressRoot.parentNode.removeChild(this._progressRoot);
    }

    this._visible = false;
    return this;
  }

  /**
   * @param {import('../../primitives/ui.js').Control|HTMLElement} container
   * @returns {Toast}
   */
  showIn(container) {
    if (!container) return this;
    const host = container.dom || container;
    const prev = host.querySelector(".Toast");
    if (prev) prev.remove();
    host.prepend(this.dom);
    this._visible = true;
    return this;
  }
}
