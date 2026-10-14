declare module "@aeco-dev/gui" {
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
  export class ThemeToggle extends Control {
    constructor(options?: { theme?: "light" | "dark"; onChange?: (theme: "light" | "dark") => void });
    setTheme(theme: "light" | "dark", notify?: boolean): this;
    getTheme(): "light" | "dark";
  }
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

  export interface RadialMenuItem {
    id?: string;
    name?: string;
    icon: string;
    enabled?: boolean | ((item: RadialMenuItem) => boolean);
    active?: boolean | ((item: RadialMenuItem) => boolean);
    onSelect?: (item: RadialMenuItem) => void | Promise<void>;
  }

  export class RadialMenu {
    constructor(options?: {
      viewport: HTMLElement;
      items?: RadialMenuItem[];
      shortcut?: string | string[];
    });
    setItems(items?: RadialMenuItem[]): this;
    setSelectionCount(count: number): this;
    show(): void;
    hide(): void;
    toggle(): void;
  }
}

declare module "@aeco-dev/layout" {
  import type { CollapsiblePanel, Container } from "@aeco-dev/gui";

  /** Shell with ribbon, side regions, viewport, and footer. `world.mount(parent)`. */
  export class World {
    constructor(config?: object, options?: { container?: HTMLElement });
    root: Container;
    readonly dom: HTMLElement | null;
    mount(parent?: HTMLElement): this;
  }

  export type LayoutPosition = "left" | "right" | "bottom";
  export type LayoutEventName = "tab:added" | "tab:removed" | "tab:selected" | "workspace";

  export interface LayoutOptions {
    leftWorkspaceWidth?: number;
    rightWorkspaceWidth?: number;
    bottomWorkspaceHeight?: number;
    topWorkspaceHeight?: number;
    footerBarHeight?: number;
    leftOpen?: boolean;
    rightOpen?: boolean;
    bottomOpen?: boolean;
    minPanelSize?: number;
    resizerSize?: number;
  }

  /**
   * Region grid. `new Layout(options).init(world)`.
   * Events: `tab:added`, `tab:removed`, `tab:selected`, `workspace`.
   */
  export class Layout {
    constructor(options?: LayoutOptions);
    init(target?: string | HTMLElement | World): this;
    on(event: LayoutEventName, handler: (payload: object) => void): () => void;
    off(event: LayoutEventName, handler: (payload: object) => void): this;
    addTab(position: LayoutPosition, id: string, label: string, content: unknown, options?: object): boolean;
    ensureTab(position: LayoutPosition, id: string, label: string, content: unknown, options?: object): boolean;
    removeTab(position: LayoutPosition, id: string, options?: { closeIfEmpty?: boolean }): boolean;
    selectTab(position: LayoutPosition, id: string, options?: { open?: boolean }): boolean;
    toggleTab(position: LayoutPosition, id: string): boolean;
    hasTab(position: LayoutPosition, id: string): boolean;
    getTabIds(position: LayoutPosition, filter?: object): string[];
    getSelectedTabId(position: LayoutPosition): string | null;
    isTabSelected(position: LayoutPosition, id: string): boolean;
    clearTabs(position: LayoutPosition, closeWorkspace?: boolean): boolean;
    setTabLabel(position: LayoutPosition, id: string, label: string): boolean;
    openWorkspace(position: LayoutPosition): this;
    closeWorkspace(position: LayoutPosition): this;
    toggleWorkspace(position: LayoutPosition): this;
    isWorkspaceOpen(position: LayoutPosition): boolean;
    setWorkspaceSize(position: LayoutPosition, size: number): this;
    getWorkspaceSize(position: LayoutPosition): number;
    resetLayout(): this;
    moveSegment(from: LayoutPosition, to: LayoutPosition, group: string): boolean;
    bindToggle(elementOrId: string | HTMLElement, position: LayoutPosition, id: string): (() => void) | null;
    prependToggleBarChild(node: Node): () => void;
    getFloatingWindowMountElement(): HTMLElement | null;
    destroy(): void;
    static World: typeof World;
    static Panel: typeof Panel;
  }

  export interface LayoutPanelOptions {
    layout?: Layout;
    position?: LayoutPosition;
    id: string;
    label: string;
    title?: string;
    icon?: string;
    group?: string;
    floatable?: boolean;
    startFloating?: boolean;
    autoShow?: boolean;
    toggle?: string | HTMLElement;
    showHeader?: boolean;
    floatingStyles?: Record<string, string>;
  }

  /** Docked panel. Pass `layout` from `new Layout(options).init(world)`. */
  export class Panel extends CollapsiblePanel {
    constructor(options: LayoutPanelOptions);
    show(options?: { select?: boolean; open?: boolean }): this;
    hide(options?: { closeIfEmpty?: boolean }): this;
    toggle(): this;
    select(): this;
    bindTo(elementOrId: string | HTMLElement): this;
    unbind(): this;
    setLabel(label: string): this;
    isVisible(): boolean;
    isSelected(): boolean;
    isFloating(): boolean;
    destroy(): void;
  }
}
