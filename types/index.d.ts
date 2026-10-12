declare module "ifcopenshell/gui" {
  export class Control {
    constructor(dom?: HTMLElement);
    dom: HTMLElement;
    add(...children: Control[]): this;
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

  export class Container extends Control {
    constructor();
    gap(size: string): this;
  }

  export class Text extends Control {
    constructor(text?: string);
    setValue(value: string): this;
  }

  export class Rectangle extends Container {
    constructor();
  }

  export class StackPanel extends Container {
    constructor(options?: { isVertical?: boolean });
    isVertical: boolean;
    gap(value: string): this;
  }

  export class InputListItem extends Control {
    constructor();
  }

  export class ScrollViewer extends Container {
    constructor(options?: { scrollable?: boolean; className?: string; fill?: boolean });
  }

  export class Button extends Control {
    constructor(label?: string);
    setValue(value: string): this;
    setIcon(iconClass: string): this;
  }

  export class InputText extends Control {
    dom: HTMLInputElement;
    constructor(text?: string);
    getValue(): string;
    setValue(value: string): this;
  }

  export class InputSearch extends InputText {
    constructor(placeholder?: string, onInput?: ((value: string) => void) | null);
  }

  export class Checkbox extends Control {
    constructor(checked?: boolean);
    getValue(): boolean;
    setValue(value: boolean): this;
  }

  export class InputDropdown extends Control {
    constructor();
    getValue(): string;
    setValue(value: string): this;
    onChange(callback: (event?: Event) => void): this;
  }

  export class Caption extends Control {
    constructor(text?: string);
    setValue(value: string): this;
  }

  export class Title extends Text {
    constructor(text?: string);
  }
  export class Disclaimer extends Text {
    constructor(text?: string);
  }
  export class Code extends Text {
    constructor(text?: string);
  }
  export class Kbd extends Text {
    constructor(key?: string);
  }
  export class Badge extends Text {
    constructor(text?: string);
  }
  export class Card extends Rectangle {
    constructor();
  }
  export class Spacer extends Container {
    constructor(size?: string);
  }
  export class HSpacer extends Text {
    constructor(size?: string);
  }
  export class Handle extends Text {
    constructor(type?: string);
  }
  export class Canvas extends Control {
    constructor();
    dom: HTMLCanvasElement;
  }
  export class Image extends Control {
    constructor(path?: string);
    getValue(): string;
    set(path: string): this;
    setValue(value: string): this;
  }
  export class Svg extends Control {
    constructor(pathOrElement?: string | Element);
    ready: Promise<void>;
  }
  export class Grid extends Container {
    constructor();
  }
  export class Line extends Control {
    constructor();
  }
  export class LineBreak extends Control {
    constructor();
  }
  export class TabView extends Container {
    constructor();
    addTab(id: string, label: string, content?: Control[]): this;
    select(id: string): this;
  }
  export class TabItem extends Container {
    constructor(labelText: string, parent: TabView, tabOptions?: { floatable?: boolean });
  }
  export function center<T extends Control>(component: T): T;

  export class Heading extends Control {
    constructor(level?: number, text?: string);
    level: number;
    setValue(text: string): this;
  }

  export interface NavigationViewOptions {
    sidebarWidth?: string;
    sidebarMinWidth?: string;
    sidebarMaxWidth?: string;
    sidebarVisible?: boolean;
    sidebarBorder?: boolean;
    sidebarResizable?: boolean;
    className?: string;
  }

  export class NavigationView extends Container {
    constructor(options?: NavigationViewOptions);
    sidebarHeader: Container;
    sidebarBody: StackPanel;
    sidebarFooter: Container;
    sidebarResizer: Container | null;
    main: Container;
    mainBody: StackPanel;
    appendMain(...content: Control[]): this;
    appendSidebar(...content: Control[]): this;
    setSidebarVisible(visible: boolean): this;
    setSidebarResizable(enabled: boolean): this;
  }

  export class Panel extends Control {}
  export class CollapsiblePanel extends Panel {}
  export class RibbonBar extends StackPanel {
    constructor(elements?: Control[], justify?: string);
    setJustify(justify: string): this;
  }
  export class Flyout extends Control {}
  export class PropertyGrid extends Control {}
  export class PropertyGridRow extends Control {}
  export class SortableList extends Control {}
  export class NavigationList extends Control {}
  export class TreeView extends Control {}
  export class FloatingWindow extends Control {}
  export class FloatingDialog extends Control {}
  export class StatusBar extends Control {}
  export class ThemeToggle extends Control {}
  export class Toast extends StackPanel {
    constructor(
      messageOrOptions?: string | { initialText?: string; indeterminate?: boolean },
      type?: string,
      options?: { duration?: number; dismissible?: boolean; autoMount?: boolean },
    );
    show(target?: string | Control | HTMLElement, text?: string, isIndeterminate?: boolean): this;
    update(percentage: number, text?: string): this;
    hide(): this;
    showIn(container: Control | HTMLElement): this;
  }
  export class LabeledBoxItem extends InputListItem {
    constructor(data: { id: string; label: string; checked?: boolean }, iconMap: Record<string, string>);
  }
  export class SplitContainer extends Container {
    constructor(direction: "horizontal" | "vertical", children?: Control[]);
  }
  export class Operator extends Container {
    constructor(name?: string);
    setIcon(iconName: string): this;
  }
  export function createSplitResizer(splitNode: { direction?: string; id?: string }, childIndex: number): Container;
  export function createLayoutResizerHandle(placement?: "left" | "right" | "bottom"): Container;
  export function makeFlexResizer(options: object): () => void;
  export function makeDraggable(panel: Control | HTMLElement, header: Control | HTMLElement): void;
  export function makeResizable(panel: Control | HTMLElement, directions?: string[]): void;

  export class Markdown extends Container {
    constructor(text?: string, options?: object);
    setContent(text: string, options?: object): this;
    setMarkdown(text: string): this;
  }
  export function markdownToHtml(markdown: string): { html: string; codes: any[] };

  export class Chart extends Rectangle {
    constructor(options?: object);
    init(): this;
  }
  export class DataGrid extends Rectangle {
    constructor(options?: object);
  }
  export class GanttChart extends Rectangle {
    constructor(options?: object);
  }
  export class NodeGraph extends Container {
    constructor(options?: object);
  }

  export class AppShell extends NavigationView {
    constructor(options?: object);
  }

  export class RadialMenu {
    constructor(options?: object);
    toggle(): void;
    open(): void;
    close(): void;
  }
}

declare module "ifcopenshell/layout" {
  import type { Container } from "ifcopenshell/gui";

  /** Application shell. `new World()` builds the default regions. */
  export class World {
    constructor(config?: object, options?: object);
    root: Container;
    readonly dom: HTMLElement | null;
    mount(parent?: HTMLElement): this;
  }

  /**
   * Workspace layout manager.
   * `new Layout(config).init(world)` attaches region stacks to a World.
   */
  export class Layout {
    constructor(options?: object);
    init(target?: string | HTMLElement | World): this;
    static World: typeof World;
    static Panel: typeof Panel;
    static dockHandlers(options: { layoutManager: unknown; tabId: string; tabLabel?: string }): object;
    static resolveFloatingMount(layout: unknown): HTMLElement | null;
    static bindPanelRegionDrag(layout: unknown, options: object): () => void;
    static setPanelDropHighlight(layout: unknown, position: string | null): void;
    static resolveOwnerKey(owner: unknown): string;
    static createResizerHandle(placement?: "left" | "right" | "bottom"): Container;
  }

  export class Panel extends import("ifcopenshell/gui").CollapsiblePanel {
    constructor(options?: object);
  }

  export function dockHandlers(options: { layoutManager: unknown; tabId: string; tabLabel?: string }): object;
  export function resolveFloatingMount(layout: unknown): HTMLElement | null;
  export function bindPanelRegionDrag(layout: unknown, options: object): () => void;
  export function setPanelDropHighlight(layout: unknown, position: string | null): void;
  export function resolveOwnerKey(owner: unknown): string;
  export function createResizerHandle(placement?: "left" | "right" | "bottom"): Container;
}
