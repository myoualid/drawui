declare module "drawui/primitives" {
  export class Control {
    constructor(dom?: HTMLElement);
    dom: HTMLElement;
    add(...children: Control[]): this;
    addClass(name: string): this;
    setClass(name: string): this;
    setStyle(style: string, values: string[]): this;
    setStyles(styles: Record<string, string>): this;
  }
}

declare module "drawui" {
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

  export class Span extends Control {
    constructor();
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

  export class IconButton extends Button {
    constructor(label?: string, options?: { icon?: string; meta?: string; active?: boolean });
    setLabel(label: string): this;
    setMeta(meta?: string): this;
    setActive(isActive: boolean): this;
  }

  export class RibbonButton extends Button {
    constructor(label?: string, options?: { icon?: string; active?: boolean });
    setLabel(label: string): this;
    setActive(isActive: boolean): this;
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

  export class Label extends Control {
    constructor(text?: string);
    setFor(id: string): this;
  }

  export class TextBlock extends Control {
    constructor(text?: string);
    setValue(value: string): this;
  }

  export class Caption extends Control {
    constructor(text?: string);
    setValue(value: string): this;
  }

  export class Title extends TextBlock {
    constructor(text?: string);
  }
  export class Disclaimer extends TextBlock {
    constructor(text?: string);
  }
  export class Code extends Span {
    constructor(text?: string);
  }
  export class Kbd extends Span {
    constructor(key?: string);
  }
  export class Badge extends TextBlock {
    constructor(text?: string);
  }
  export class Card extends Rectangle {
    constructor();
  }
  export class Spacer extends Container {
    constructor(size?: string);
  }
  export class HSpacer extends Span {
    constructor(size?: string);
  }
  export class Handle extends Span {
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

  export class Paragraph extends Control {
    constructor(text?: string);
  }

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

  export class ContentPanel extends Control {}
  export class CollapsiblePanel extends ContentPanel {}
  export class WorkspacePanel extends CollapsiblePanel {}
  export class WorkspaceLayout extends Control {}
  export class Header extends Control {}
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
  export class AppShell extends Control {}
  export class FloatingWindow extends Control {}
  export class FloatingDialog extends Control {}
  export class StatusBar extends Control {}
  export class ThemeToggle extends Control {}
  export class NodeGraph extends Control {}
  export class Chart extends Control {}
  export class GanttChart extends Control {}
  export class DataGrid extends Control {}
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
  export class InstructionLine extends StackPanel {
    constructor(keyText: string, description: string);
  }
  export class InstructionPanel extends Container {
    constructor(title: string, iconName: string, instructions?: unknown[]);
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
  export class ToolbarButton extends Button {
    constructor(text?: string, extraStyles?: Record<string, string>);
  }
  export function createSplitResizer(splitNode: { direction?: string; id?: string }, childIndex: number): Container;
  export function createLayoutResizerHandle(placement?: "left" | "right" | "bottom"): Container;
  export function makeFlexResizer(options: object): () => void;
  export function makeDraggable(panel: Control | HTMLElement, header: Control | HTMLElement): void;
  export function makeResizable(panel: Control | HTMLElement, directions?: string[]): void;
  export function buildWorkspaceDockHandlers(options: {
    layoutManager: unknown;
    tabId: string;
    tabLabel: string;
  }): object;
  export function buildWorldFromConfig(config: object, container?: HTMLElement | null, options?: object): object;
  export function createDefaultWorldConfig(overrides?: object): object;
  /** Spreadsheet factory alias (full build; returns DataGrid). */
  export function Spreadsheet(options?: object): DataGrid;

  export class Markdown extends Container {
    constructor(text?: string, options?: object);
    setContent(text: string, options?: object): this;
    setMarkdown(text: string): this;
  }
  export function markdownToHtml(markdown: string): { html: string; codes: any[] };

  /**
   * Generated factories (`DrawUI.Button()` → `new Button()`) + peer Chart/Spreadsheet on full.
   * Component factories are PascalCase; utilities like `center` stay camelCase.
   */
  export class DrawUI {
    static Markdown(...args: any[]): Markdown;
    static Chart(options?: object): Chart;
    static Spreadsheet(options?: object): DataGrid;
    static Row(): StackPanel;
    static Column(): StackPanel;
    static center<T extends Control>(component: T): T;
    static H1(text?: string): Heading;
    static H2(text?: string): Heading;
    static H3(text?: string): Heading;
    static H4(text?: string): Heading;
    static H5(text?: string): Heading;
    static H6(text?: string): Heading;
    static Button(...args: any[]): Button;
    static IconButton(...args: any[]): IconButton;
    static RibbonButton(...args: any[]): RibbonButton;
    static Icon(...args: any[]): Icon;
    static TextBlock(...args: any[]): TextBlock;
    static Caption(...args: any[]): Caption;
    static Title(...args: any[]): Title;
    static Disclaimer(...args: any[]): Disclaimer;
    static Paragraph(...args: any[]): Paragraph;
    static Heading(...args: any[]): Heading;
    static Span(...args: any[]): Span;
    static Code(...args: any[]): Code;
    static Kbd(...args: any[]): Kbd;
    static Badge(...args: any[]): Badge;
    static Label(...args: any[]): Label;
    static Form(...args: any[]): Form;
    static Hyperlink(...args: any[]): Hyperlink;
    static Image(...args: any[]): Image;
    static Svg(...args: any[]): Svg;
    static Canvas(...args: any[]): Canvas;
    static Container(...args: any[]): Container;
    static StackPanel(...args: any[]): StackPanel;
    static ScrollViewer(...args: any[]): ScrollViewer;
    static Grid(...args: any[]): Grid;
    static Rectangle(...args: any[]): Rectangle;
    static Card(...args: any[]): Card;
    static Spacer(...args: any[]): Spacer;
    static HSpacer(...args: any[]): HSpacer;
    static Handle(...args: any[]): Handle;
    static Line(...args: any[]): Line;
    static LineBreak(...args: any[]): LineBreak;
    static InputText(...args: any[]): InputText;
    static InputTextArea(...args: any[]): InputTextArea;
    static InputSearch(...args: any[]): InputSearch;
    static InputDropdown(...args: any[]): InputDropdown;
    static Checkbox(...args: any[]): Checkbox;
    static InputColor(...args: any[]): InputColor;
    static InputNumber(...args: any[]): InputNumber;
    static InputInteger(...args: any[]): InputInteger;
    static Slider(...args: any[]): Slider;
    static InputDate(...args: any[]): InputDate;
    static List(...args: any[]): InputList;
    static ListItem(...args: any[]): InputListItem;
    static ProgressBar(...args: any[]): ProgressBar;
    static ProgressRing(...args: any[]): ProgressRing;
    static Tooltip(...args: any[]): Tooltip;
    static TabView(...args: any[]): TabView;
    static Toast(...args: any[]): Toast;
    static Operator(...args: any[]): Operator;
    static InstructionLine(...args: any[]): InstructionLine;
    static InstructionPanel(...args: any[]): InstructionPanel;
    static LabeledBoxItem(...args: any[]): LabeledBoxItem;
    static SplitContainer(...args: any[]): SplitContainer;
    static ContentPanel(...args: any[]): ContentPanel;
    static FloatingDialog(...args: any[]): FloatingDialog;
    static CollapsiblePanel(...args: any[]): CollapsiblePanel;
    static WorkspacePanel(...args: any[]): WorkspacePanel;
    static Header(...args: any[]): Header;
    static RibbonBar(...args: any[]): RibbonBar;
    static Flyout(...args: any[]): Flyout;
    static NavigationView(...args: any[]): NavigationView;
    static NavigationList(...args: any[]): NavigationList;
    static TreeView(...args: any[]): TreeView;
    static AppShell(...args: any[]): AppShell;
    static PropertyGrid(...args: any[]): PropertyGrid;
    static PropertyGridRow(...args: any[]): PropertyGridRow;
    static SortableList(...args: any[]): SortableList;
    static ToolbarButton(...args: any[]): ToolbarButton;
    static WorkspaceLayout(...args: any[]): WorkspaceLayout;
  }
}
