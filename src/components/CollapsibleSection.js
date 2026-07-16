import { UIDiv, UIRow, UIIcon, UIText } from "../primitives/ui.js";

class CollapsibleSection extends UIDiv {
  constructor(options = {}) {
    super();

    this.options = {
      title: options.title || "Section",
      collapsed: options.collapsed || false,
      icon: options.icon || null,
      className: options.className || null,
      ...options,
    };

    this.addClass('CollapsibleSection');

    this.header = new UIRow();

    this.header.addClass("CollapsibleSection-header");

    this.titleEl = new UIText(this.options.title);

    this.titleEl.addClass("CollapsibleSection-title");

    this.toggleIcon = new UIIcon(this.options.collapsed ? "chevron_right" : "expand_less");

    this.toggleIcon.addClass("CollapsibleSection-toggle");

    if (this.options.icon) {
      this.leftIcon = new UIIcon(this.options.icon);

      this.leftIcon.addClass("CollapsibleSection-leftIcon");

      this.header.add(this.leftIcon);
    }

    this.header.add(this.titleEl);

    this.header.add(this.toggleIcon);

    this.header.dom.tabIndex = 0;

    this.header.dom.setAttribute('role', 'button');

    this.header.dom.style.cursor = 'pointer';

    this.header.dom.setAttribute('aria-expanded', String(!this.options.collapsed));

    this.add(this.header);

    this.body = new UIDiv();

    this.body.addClass("CollapsibleSection-body");


    if (this.options.className) this.addClass(this.options.className);

    if (this.options.collapsed) this.addClass("collapsed");

    this.add(this.body);

    const scope = this;

    this.header.onClick(() => scope.toggle());

    this.header.onKeyDown((event) => {
      if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
        event.preventDefault();

        scope.toggle();
      }
    });
  }

  setContent(element) {
    this.body.clear();

    this.body.add(element);

    return this;
  }

  addContent(element) {
    this.body.add(element);

    return this;
  }

  collapse() {
    this.addClass("collapsed");

    this.toggleIcon.modify("chevron_right");

    this.header.dom.setAttribute('aria-expanded', 'false');

    return this;
  }

  expand() {
    this.removeClass("collapsed");

    this.toggleIcon.modify("expand_less");

    this.header.dom.setAttribute('aria-expanded', 'true');

    return this;
  }

  toggle() {
    if (this.dom.classList.contains("collapsed")) this.expand();
    else this.collapse();

    return this;
  }

  setTitle(text) {
    this.titleEl.setTextContent(text);

    return this;
  }
}

export { CollapsibleSection };
