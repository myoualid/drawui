declare module "drawui/primitives" {
  export class UIElement {
    constructor(dom?: HTMLElement);
    dom: HTMLElement;
    add(...children: UIElement[]): this;
    addClass(name: string): this;
    setClass(name: string): this;
    setStyle(style: string, values: string[]): this;
    setStyles(styles: Record<string, string>): this;
  }
}

declare module "drawui" {
  export class UIElement {
    constructor(dom?: HTMLElement);
    dom: HTMLElement;
    add(...children: UIElement[]): this;
    setId(id: string): this;
    setClass(name: string): this;
    addClass(name: string): this;
    removeClass(name: string): this;
    toggleClass(name: string, toggle?: boolean): this;
    setStyle(style: string, values: string[]): this;
    setStyles(styles: Record<string, string>): this;
    setTextContent(value: string): this;
    setDisabled(disabled: boolean): this;
    setHidden(hidden: boolean): this;
    gap(size: string): this;
    padding(size: string): this;
    onClick(callback: (event?: Event) => void): this;
    onChange(callback: (event?: Event) => void): this;
    clear(): this;
  }

  export class UIDiv extends UIElement {
    constructor();
    gap(size: string): this;
  }

  export class UIColumn extends UIDiv {
    constructor();
    gap(value: string): this;
  }

  export class UIRow extends UIDiv {
    constructor();
    gap(value: string): this;
  }

  export class UIButton extends UIElement {
    constructor(label?: string);
    setValue(value: string): this;
  }

  export class UIInput extends UIElement {
    dom: HTMLInputElement;
    constructor(text?: string);
    getValue(): string;
    setValue(value: string): this;
  }

  export class UICheckbox extends UIElement {
    constructor(checked?: boolean);
    getValue(): boolean;
    setValue(value: boolean): this;
  }

  export class UISelect extends UIElement {
    constructor();
    getValue(): string;
    setValue(value: string): this;
    onChange(callback: (event?: Event) => void): this;
  }

  export class UILabel extends UIElement {
    constructor(text?: string);
    setFor(id: string): this;
  }

  export class UIText extends UIElement {
    constructor(text?: string);
    setValue(value: string): this;
  }

  export class UISmallText extends UIElement {
    constructor(text?: string);
    setValue(value: string): this;
  }

  export class UIParagraph extends UIElement {
    constructor(text?: string);
  }

  export interface SidebarLayoutOptions {
    sidebarWidth?: string;
    sidebarMinWidth?: string;
    sidebarMaxWidth?: string;
    sidebarVisible?: boolean;
    sidebarBorder?: boolean;
    sidebarResizable?: boolean;
    className?: string;
  }

  export class SidebarLayout extends UIDiv {
    constructor(options?: SidebarLayoutOptions);
    sidebarHeader: UIDiv;
    sidebarBody: UIColumn;
    sidebarFooter: UIDiv;
    sidebarResizer: UIDiv | null;
    main: UIDiv;
    mainBody: UIColumn;
    appendMain(...content: UIElement[]): this;
    appendSidebar(...content: UIElement[]): this;
    setSidebarVisible(visible: boolean): this;
    setSidebarResizable(enabled: boolean): this;
  }

  export class DrawUI {
    static div(): UIDiv;
    static column(): UIColumn;
    static row(): UIRow;
    static h2(text?: string): UIText;
    static paragraph(text?: string): UIParagraph;
    static button(text?: string): UIButton;
    static input(): UIInput;
    static checkbox(checked?: boolean): UICheckbox;
    static select(): UISelect;
    static label(text?: string): UILabel;
    static smallText(text?: string): UISmallText;
    static text(text?: string): UIText;
    static icon(name?: string): UIElement;
    static image(path?: string, size?: { width: string; height: string }): UIElement;
    static sidebarLayout(options?: SidebarLayoutOptions): SidebarLayout;
  }
}
