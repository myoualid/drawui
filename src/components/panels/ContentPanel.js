import { Rectangle, Container, Control, Button } from "../../primitives/ui.js";

import { ICONS } from "../../icons.js";
import { resolveWorldNodeId } from "../../workspace/moduleBridge.js";

import { Header } from "./Header.js";
import { RibbonBar } from "./RibbonBar.js";

import { makeResizable, makeDraggable } from "../../overlays/drag.js";

/**
 * Panel scaffold with uniform region APIs:
 * - `header(...)` / `content(...)` / `footer(...)` replace a region
 * - `add(...)` appends to the content region
 *
 * DOM: `.ContentPanel` > `.Header` / `.PanelContent` / `.RibbonBar`
 *
 * @example
 * return new ContentPanel()
 *   .header("Inspector", "info")
 *   .add(new TextBlock("ContentPanel body"))
 *   .add(new Button("Action").addClass("primary"));
 *
 * @category Panels
 */
export class ContentPanel extends Rectangle {
  constructor(options = {}) {
    super();

    const {
      context,
      operators,
      id,
      moduleId,
      shouldRegister = false,
      parentId,
      panelStyles = {},
      resizeHandles = ['e', 's', 'se'],
      resizable = true,
      stopPropagation = true,
      testing = false,
      draggable = false,
      position = null,
      showHeader = true,
      showFooter = true,
      title,
      icon,
      headerActions = [],
      footer: footerItems = [],
      footerJustify = 'flex-end',
    } = options;

    this.positionStrategy = position;
    this.resizeHandles = resizeHandles;
    this.context = context;
    this.operators = operators;
    this.isActive = false;
    this.stopPropagation = stopPropagation;
    this.moduleId = moduleId || null;
    this._draggable = draggable;
    this._showHeader = showHeader;
    this._showFooter = showFooter;

    /** @type {Header|null} */
    this._header = null;
    /** @type {Container} */
    this._body = new Container();
    this._body.addClass('PanelContent');
    /** @type {RibbonBar|null} */
    this._footer = null;

    this.parentId = parentId || resolveWorldNodeId(context, moduleId);
    this.parent = this.parentId ? document.getElementById(this.parentId) : null;

    this.addClass('ContentPanel');
    this._mount(this._body);

    if (showHeader) {
      this.header({ title: title || '', icon, actions: headerActions });
    }
    if (showFooter) {
      this.footer(footerItems, footerJustify);
    }

    if (resizable && resizeHandles.length > 0) {
      makeResizable(this.dom, resizeHandles);
    }

    const defaultStyles = {
      height: 'fit-content',
      maxHeight: '100vh',
      maxWidth: '100vw',
      overflow: 'hidden',
      ...panelStyles
    };

    for (const [key, value] of Object.entries(defaultStyles)) {
      this.setStyle(key, [value]);
    }

    if (this.parent) this.setupParentListener(context);
    if (testing) this.toggle(context);
    if (shouldRegister) this.context.ui.model.registerChild(this.parentId, id, this);
  }

  /**
   * Mount a chrome slot onto the panel root (not into the content body).
   * @param {import('../../primitives/ui.js').Control} slot
   * @param {Node|null} [before]
   * @private
   */
  _mount(slot, before = null) {
    if (before) this.dom.insertBefore(slot.dom, before);
    else this.dom.appendChild(slot.dom);
  }

  /**
   * Set / replace the header region.
   * @param {string|Object|Header} [titleOrOptions]
   * @param {string} [icon]
   * @param {import('../../primitives/ui.js').Control[]} [actions]
   * @returns {this}
   */
  header(titleOrOptions = {}, icon, actions = []) {
    const next = titleOrOptions instanceof Header
      ? titleOrOptions
      : new Header(
          typeof titleOrOptions === 'string'
            ? { title: titleOrOptions, icon, actions }
            : { icon, actions, ...titleOrOptions },
        );

    if (this._header) this._header.dom.replaceWith(next.dom);
    else this._mount(next, this._body.dom);

    this._header = next;
    this._showHeader = true;

    if (this._draggable) {
      makeDraggable(this.dom, this._header.dom);
    }

    return this;
  }

  /**
   * Set / replace the content region (clears existing children).
   * @param {...import('../../primitives/ui.js').Control} children
   * @returns {this}
   */
  content(...children) {
    this._body.clear();
    return this.add(...children);
  }

  /**
   * Set / replace the footer region.
   * @param {import('../../primitives/ui.js').Control[]|RibbonBar} [elements]
   * @param {string} [justify='flex-end']
   * @returns {this}
   */
  footer(elements = [], justify = 'flex-end') {
    const next = elements instanceof RibbonBar
      ? elements
      : new RibbonBar(Array.isArray(elements) ? elements : [elements], justify);

    if (this._footer) this._footer.dom.replaceWith(next.dom);
    else this._mount(next);

    this._footer = next;
    this._showFooter = true;
    return this;
  }

  /**
   * Append children to the content region.
   * @param {...import('../../primitives/ui.js').Control} children
   * @returns {this}
   */
  add(...children) {
    for (const child of children) {
      if (child instanceof Control) this._body.add(child);
    }
    return this;
  }

  /** @returns {this} */
  clear() {
    this._body.clear();
    return this;
  }

  setTitle(title) {
    this._header?.setTitle(title);
    return this;
  }

  setIcon(iconName) {
    this._header?.setIcon(iconName);
    return this;
  }

  addHeaderAction(action) {
    this._header?.addAction(action);
    return this;
  }

  setupParentListener(context) {
    this.parent.style.cursor = 'pointer';

    this.parent.addEventListener('click', (e) => {
      e.stopPropagation();

      e.preventDefault();

      this.toggle(context);
    });
  }

  toggle(context, options = {}) {
    if (this.isActive) {
      this.hidePanel();
    } else {
      this.showPanel(context, options);
    }
  }

  show(options = {}) {
    if (!this.isActive) {
      this.showPanel(this.context, options);
    }

    return this;
  }

  hide() {
    if (this.isActive) {
      this.hidePanel();
    }

    return this;
  }

  setStyles(styles = {}) {
    for (const [key, value] of Object.entries(styles)) {
      this.dom.style[key] = value;
    }

    return this;
  }

  showPanel(context, options = {}) {
    // Store anchor options for positioning
    this.anchorOptions = options;

    const viewportDom =
      context?.viewport?.dom ||
      context?.viewport ||
      (typeof document !== "undefined" ? document.body : null);

    if (!viewportDom) return;

    if (this.dom.parentNode !== viewportDom) {
      viewportDom.appendChild(this.dom);
    }

    // Standalone / gallery usage without an app viewport
    if (!context?.viewport) {
      this.dom.style.position = "fixed";
      this.dom.style.zIndex = "10060";
    }

    this.positionPanel();

    if (this.parent) {
      this.parent.classList.add('Active');
    }

    // Stop propagation inside panel
    if (this.stopPropagation) {
      this.dom.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    this.isActive = true;

    this.onShow();
  }

  positionPanel() {
    const panelDom = this.dom;

    panelDom.style.position = 'absolute';

    if (this.positionStrategy == null) {
      panelDom.style.top = '0px';

      panelDom.style.left = '0px';

      panelDom.style.right = 'auto';

      panelDom.style.bottom = 'auto';

      panelDom.style.transform = 'none';

      return;
    }

    if (this.anchorOptions && this.anchorOptions.anchor) {
      this.positionAtAnchor(this.anchorOptions);

      return;
    }

    if (!this.parent) {
      this.positionDefault();

      return;
    }

    const rect = this.parent.getBoundingClientRect();

    if (this.dom.style.top !== '') return;

    let effectivePosition = this.positionStrategy;

    if (effectivePosition === 'auto') {
      effectivePosition = this.determinePositionFromContext(rect);
    }

    switch (effectivePosition) {
      case 'left':
        this.positionLeft(rect);

        break;

      case 'right':
        this.positionRight(rect);

        break;

      case 'above':
        this.positionAbove(rect);

        break;

      case 'above-center':
        this.positionAboveCenter(rect);

        break;

      case 'above-left':
        this.positionAboveLeft(rect);

        break;

      case 'below-left':
        this.positionBelowLeft(rect);

        break;

      case 'below-center':
        this.positionBelowCenter(rect);

        break;

      case 'below':

      default:
        this.positionBelow(rect);

        break;
    }
  }

  determinePositionFromContext(rect) {
    const viewportWidth = window.innerWidth;

    const viewportHeight = window.innerHeight;

    const parentCenterX = rect.left + rect.width / 2;

    const parentCenterY = rect.top + rect.height / 2;

    const isInRightSide = parentCenterX > viewportWidth * 0.7;

    const isInBottomSide = parentCenterY > viewportHeight * 0.6;

    if (isInRightSide && isInBottomSide) return 'above-left';

    if (this.resizeHandles.includes('n')) return isInRightSide ? 'above-left' : 'above';

    if (this.resizeHandles.includes('w') && !this.resizeHandles.includes('e')) {
      return isInBottomSide ? 'above-left' : 'left';
    }

    if (parentCenterX > viewportWidth * 0.85) return 'left';

    if (parentCenterX < viewportWidth * 0.3) return 'below';

    return 'below-center';
  }

  positionBelow(rect) {
    const panelDom = this.dom;

    panelDom.style.top = (rect.bottom + 5) + 'px';

    panelDom.style.left = rect.left + 'px';

    panelDom.style.right = 'auto';

    panelDom.style.bottom = 'auto';

    panelDom.style.transform = 'none';
  }

  positionBelowCenter(rect) {
    const panelDom = this.dom;

    panelDom.style.top = (rect.bottom + 5) + 'px';

    panelDom.style.left = (rect.left + rect.width / 2) + 'px';

    panelDom.style.right = 'auto';

    panelDom.style.bottom = 'auto';

    panelDom.style.transform = 'translateX(-50%)';
  }

  positionBelowLeft(rect) {
    const panelDom = this.dom;

    const gap = 10;

    panelDom.style.transform = 'none';

    panelDom.style.top = rect.top + 'px';

    panelDom.style.bottom = 'auto';

    panelDom.style.left = 'auto';

    panelDom.style.right = (window.innerWidth - rect.left + gap) + 'px';

    requestAnimationFrame(() => {
      const panelRect = panelDom.getBoundingClientRect();

      if (panelRect.bottom > window.innerHeight - 10) {
        panelDom.style.top = 'auto';

        panelDom.style.bottom = '10px';
      }

      if (panelRect.left < 10) {
        panelDom.style.right = (window.innerWidth - panelRect.width - 10) + 'px';
      }
    });
  }

  positionLeft(rect) {
    const panelDom = this.dom;

    const gap = 10;

    panelDom.style.transform = 'none';

    panelDom.style.top = rect.top + 'px';

    panelDom.style.bottom = 'auto';

    panelDom.style.left = 'auto';

    panelDom.style.right = (window.innerWidth - rect.left + gap) + 'px';

    requestAnimationFrame(() => {
      const panelRect = panelDom.getBoundingClientRect();

      if (panelRect.bottom > window.innerHeight - 10) {
        const overflow = panelRect.bottom - window.innerHeight + 10;

        panelDom.style.top = (rect.top - overflow) + 'px';
      }

      if (panelRect.top < 10) {
        panelDom.style.top = '10px';
      }

      if (panelRect.left < 10) {
        panelDom.style.right = (window.innerWidth - panelRect.width - 10) + 'px';
      }
    });
  }

  positionRight(rect) {
    const panelDom = this.dom;

    const gap = 10;

    panelDom.style.transform = 'none';

    panelDom.style.top = rect.top + 'px';

    panelDom.style.bottom = 'auto';

    panelDom.style.right = 'auto';

    panelDom.style.left = (rect.right + gap) + 'px';

    requestAnimationFrame(() => {
      const panelRect = panelDom.getBoundingClientRect();

      if (panelRect.right > window.innerWidth - 10) {
        panelDom.style.left = (window.innerWidth - panelRect.width - 10) + 'px';
      }
    });
  }

  positionAbove(rect) {
    const panelDom = this.dom;

    const gap = 10;

    panelDom.style.transform = 'none';

    panelDom.style.left = rect.left + 'px';

    panelDom.style.right = 'auto';

    panelDom.style.bottom = 'auto';

    requestAnimationFrame(() => {
      const panelRect = panelDom.getBoundingClientRect();

      panelDom.style.top = (rect.top - panelRect.height - gap) + 'px';

      if (panelRect.top < 10) panelDom.style.top = '10px';

      if (panelRect.left < 10) panelDom.style.left = '10px';

      if (panelRect.right > window.innerWidth - 10) {
        panelDom.style.left = (window.innerWidth - panelRect.width - 10) + 'px';
      }
    });
  }

  positionAboveCenter(rect) {
    const panelDom = this.dom;

    const gap = 10;

    panelDom.style.left = (rect.left + rect.width / 2) + 'px';

    panelDom.style.transform = 'translateX(-50%)';

    panelDom.style.right = 'auto';

    panelDom.style.bottom = 'auto';

    requestAnimationFrame(() => {
      const panelRect = panelDom.getBoundingClientRect();

      panelDom.style.top = (rect.top - panelRect.height - gap) + 'px';

      if (panelRect.top < 10) panelDom.style.top = '10px';

      if (panelRect.left < 10) {
        panelDom.style.left = (panelRect.width / 2 + 10) + 'px';
      }

      if (panelRect.right > window.innerWidth - 10) {
        panelDom.style.left = (window.innerWidth - panelRect.width / 2 - 10) + 'px';
      }
    });
  }

  positionAboveLeft(rect) {
    const panelDom = this.dom;

    const gap = 10;

    panelDom.style.transform = 'none';

    panelDom.style.top = 'auto';

    panelDom.style.left = 'auto';

    panelDom.style.bottom = (window.innerHeight - rect.bottom) + 'px';

    panelDom.style.right = (window.innerWidth - rect.left + gap) + 'px';

    requestAnimationFrame(() => {
      const panelRect = panelDom.getBoundingClientRect();

      if (panelRect.top < 10) {
        const overflow = 10 - panelRect.top;

        panelDom.style.bottom = (parseInt(panelDom.style.bottom) - overflow) + 'px';
      }

      if (panelRect.left < 10) {
        const overflow = 10 - panelRect.left;

        panelDom.style.right = (parseInt(panelDom.style.right) - overflow) + 'px';
      }
    });
  }

  positionDefault() {
    const panelDom = this.dom;
    const offsetParent = panelDom.offsetParent instanceof HTMLElement ? panelDom.offsetParent : null;
    const boundsWidth = offsetParent?.clientWidth ?? window.innerWidth;
    const boundsHeight = offsetParent?.clientHeight ?? window.innerHeight;

    panelDom.style.transform = 'none';

    panelDom.style.top = 'auto';

    panelDom.style.bottom = 'auto';

    panelDom.style.left = 'auto';

    panelDom.style.right = 'auto';

    switch (this.positionStrategy) {
      case 'left':
        panelDom.style.top = '80px';

        panelDom.style.left = '80px';

        break;

      case 'right':
        panelDom.style.top = '80px';

        panelDom.style.right = '80px';

        break;

      case 'above-left':

      case 'below-left':
        panelDom.style.bottom = '80px';

        panelDom.style.right = '80px';

        break;

      default:
        requestAnimationFrame(() => {
          const panelRect = panelDom.getBoundingClientRect();
          const maxLeft = Math.max(10, boundsWidth - panelRect.width - 10);
          const maxTop = Math.max(10, boundsHeight - panelRect.height - 10);

          panelDom.style.left = Math.min(Math.max((boundsWidth - panelRect.width) / 2, 10), maxLeft) + 'px';
          panelDom.style.top = Math.min(Math.max((boundsHeight - panelRect.height) / 2, 10), maxTop) + 'px';
          panelDom.style.right = 'auto';
          panelDom.style.bottom = 'auto';
          panelDom.style.transform = 'none';
        });

        break;
    }

    requestAnimationFrame(() => {
      const panelRect = panelDom.getBoundingClientRect();
      const parentRect = offsetParent?.getBoundingClientRect();
      const localTop = parentRect ? panelRect.top - parentRect.top : panelRect.top;
      const localLeft = parentRect ? panelRect.left - parentRect.left : panelRect.left;
      const localRight = parentRect ? panelRect.right - parentRect.left : panelRect.right;
      const localBottom = parentRect ? panelRect.bottom - parentRect.top : panelRect.bottom;

      if (localTop < 10) {
        panelDom.style.top = '10px';

        panelDom.style.bottom = 'auto';

        panelDom.style.transform = 'none';
      }

      if (localLeft < 10) {
        panelDom.style.left = '10px';

        panelDom.style.right = 'auto';

        panelDom.style.transform = 'none';
      }

      if (localRight > boundsWidth - 10) {
        panelDom.style.left = 'auto';

        panelDom.style.right = '10px';

        panelDom.style.transform = 'none';
      }

      if (localBottom > boundsHeight - 10) {
        panelDom.style.top = 'auto';

        panelDom.style.bottom = '10px';

        panelDom.style.transform = 'none';
      }
    });
  }

  positionAtAnchor(options) {
    const { anchor, horizontal = 'left', vertical = 'bottom' } = options;

    const panelDom = this.dom;

    const gap = 10;

    let anchorRect;

    if (anchor && typeof anchor === 'object' && 'clientX' in anchor && 'clientY' in anchor) {
      anchorRect = {
        top: anchor.clientY,
        bottom: anchor.clientY,
        left: anchor.clientX,
        right: anchor.clientX,
        width: 0,
        height: 0,
      };
    } else if (anchor.getBoundingClientRect) {
      anchorRect = anchor.getBoundingClientRect();
    } else if (anchor.dom && anchor.dom.getBoundingClientRect) {
      anchorRect = anchor.dom.getBoundingClientRect();
    } else {
      this.positionDefault();

      return;
    }

    panelDom.style.transform = 'none';

    panelDom.style.top = 'auto';

    panelDom.style.bottom = 'auto';

    panelDom.style.left = 'auto';

    panelDom.style.right = 'auto';

    requestAnimationFrame(() => {
      const panelRect = panelDom.getBoundingClientRect();

      const maxLeft = Math.max(10, window.innerWidth - panelRect.width - 10);

      const maxTop = Math.max(10, window.innerHeight - panelRect.height - 10);

      let leftPos;

      switch (horizontal) {
        case 'right':
          leftPos = anchorRect.right - panelRect.width;

          break;

        case 'center':
          leftPos = anchorRect.left + anchorRect.width / 2 - panelRect.width / 2;

          break;

        case 'left':

        default:
          leftPos = anchorRect.left;

          break;
      }

      let topPos;

      switch (vertical) {
        case 'top':
          topPos = anchorRect.top - panelRect.height - gap;

          if (topPos < 10) {
            topPos = anchorRect.bottom + gap;
          }

          break;

        case 'center':
          topPos = anchorRect.top + anchorRect.height / 2 - panelRect.height / 2;

          break;

        case 'bottom':

        default:
          topPos = anchorRect.bottom + gap;

          if (topPos + panelRect.height > window.innerHeight - 10) {
            topPos = anchorRect.top - panelRect.height - gap;
          }

          break;
      }

      panelDom.style.left = Math.min(Math.max(leftPos, 10), maxLeft) + 'px';

      panelDom.style.top = Math.min(Math.max(topPos, 10), maxTop) + 'px';
    });
  }

  hidePanel() {
    if (this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }

    if (this.parent) {
      this.parent.classList.remove('Active');
    }

    this.isActive = false;

    this.onHide();
  }

  refresh() {
    this.clear();
    this.draw();
  }

  draw() {}
  onShow() {}
  onHide() {}

  destroy() {
    this.hidePanel();
  }
}

/**
 * Lightweight floating panel built on {@link ContentPanel}.
 * @category Overlays
 */
export class FloatingDialog extends ContentPanel {
  static get isMobile() {
    return window.innerWidth <= 768;
  }

  constructor(options = {}) {
    const {
      context,
      operators,
      parentId = null,
      panelStyles = {},
      resizeHandles,
      resizable,
      draggable,
      position = 'center',
      title = 'Window',
      icon = ICONS.check,
    } = options;

    const mobile = FloatingDialog.isMobile;

    super({
      ...options,
      context,
      operators,
      parentId,
      draggable: draggable ?? !mobile,
      resizable: resizable ?? !mobile,
      resizeHandles: resizeHandles ?? (mobile ? [] : ['e', 's', 'se']),
      position,
      panelStyles: {
        width: mobile ? 'min(90vw, 32rem)' : '25vw',
        height: 'fit-content',
        maxHeight: 'calc(100% - 1rem)',
        maxWidth: 'calc(100% - 1rem)',
        background: 'var(--dui-surface-bg)',
        ...panelStyles,
      },
    });

    const closeBtn = new Button().setIcon('close');
    closeBtn
      .setTooltip('Close')
      .setStyle('padding', ['0.25rem'])
      .setStyle('min-height', ['auto'])
      .setStyle('border', ['none'])
      .setStyle('background', ['transparent'])
      .setStyle('opacity', ['0.7']);
    closeBtn.dom.addEventListener("mouseenter", () => closeBtn.setStyle('opacity', ['1']));
    closeBtn.dom.addEventListener("mouseleave", () => closeBtn.setStyle('opacity', ['0.7']));
    closeBtn.dom.addEventListener("click", () => this.hide());

    this.header({ title, icon, actions: [closeBtn] });
    if (!FloatingDialog.isMobile) this._header.setStyle('cursor', ['move']);
  }

  restore() {
    return this.show();
  }

  minimize() {
    return this.hide();
  }

  get isMinimized() {
    return !this.isActive;
  }
}
