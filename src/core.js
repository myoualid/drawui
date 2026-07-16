// @ts-nocheck
// Core (min) public entry — no peer-dependent components (chart, spreadsheet, gantt, Showdown markdown).

import { sanitizeHtml, simpleMarkdownToHtml } from "./utils/markdown.js";

import {
  UIText,
  UIImage,
  UISVG,
  UILink,
  UIPanel,
  UIButton,
  UIInput,
  UICheckbox,
  UIRow,
  UIDatePicker,
  UISelect,
  UIListbox,
  ListboxItem,
  UIBreak,
  UIDiv,
  UISmallText,
  UIIcon,
  UISpan,
  UITextArea,
  UINumber,
  UIInteger,
  UISlider,
  UIColor,
  UIProgress,
  UIHorizontalRule,
  UITabbedPanel,
  UIGrid,
  UIH1,
  UIH2,
  UIH3,
  UIH4,
  UIH5,
  UIH6,
  UIParagraph,
  UISpinner,
  UITooltip,
  UILabel,
  UIForm,
  UISquareButton,
} from "./primitives/ui.js";

import { CollapsiblePanel } from "./components/CollapsiblePanel.js";

import { CollapsibleSection } from "./components/CollapsibleSection.js";

import { DrillDownUpList } from "./components/DrillDownUpList.js";

import { TreeView } from "./components/TreeView.js";

import { CompactButton, styleCompactField } from "./components/FieldControls.js";

import { PropertyTable, PropertyRow } from "./components/PropertyTable.js";

import { BasePanel, SimpleFloatingWindow } from "./layout/BasePanel.js";

import { TabPanel } from "./layout/TabPanel.js";

import {
  hideProgressBar,
  showProgressBar,
  updateProgressBar,
} from "./components/progressBar.js";

import { ReorderableList } from "./components/ReorderableList.js";

import { SidebarLayout } from "./components/SidebarLayout.js";
import { LayoutPane } from "./layout/LayoutPane.js";

import { SpaLayout } from "./components/SpaLayout.js";

import { SearchInput } from "./components/SearchInput.js";

/**
 * @typedef {import('./primitives/ui.js').UIElement} UIElement
 * @typedef {import('./primitives/ui.js').UIDiv} UIDiv
 * @typedef {import('./primitives/ui.js').UIGrid} UIGrid
 * @typedef {import('./primitives/ui.js').UIText} UIText
 * @typedef {import('./primitives/ui.js').UIButton} UIButton
 * @typedef {import('./primitives/ui.js').UISquareButton} UISquareButton
 * @typedef {import('./primitives/ui.js').UIInput} UIInput
 * @typedef {import('./components/SearchInput.js').SearchInput} SearchInput
 * @typedef {import('./primitives/ui.js').UIRow} UIRow
 * @typedef {import('./primitives/ui.js').UIIcon} UIIcon
 * @typedef {import('./primitives/ui.js').UICheckbox} UICheckbox
 * @typedef {import('./primitives/ui.js').UISelect} UISelect
 * @typedef {import('./primitives/ui.js').UINumber} UINumber
 * @typedef {import('./primitives/ui.js').UIPanel} UIPanel
 * @typedef {import('./primitives/ui.js').UIProgress} UIProgress
 * @typedef {import('./primitives/ui.js').UITextArea} UITextArea
 * @typedef {import('./primitives/ui.js').UITabbedPanel} UITabbedPanel
 * @typedef {import('./primitives/ui.js').UIImage} UIImage
 * @typedef {import('./primitives/ui.js').UISVG} UISVG
 * @typedef {import('./overlays/FloatingPanel.js').FloatingPanel} FloatingPanel
 * @typedef {import('./components/CollapsiblePanel.js').CollapsiblePanel} CollapsiblePanel
 * @typedef {import('./components/CollapsibleSection.js').CollapsibleSection} CollapsibleSection
 */

/**
 * @typedef {Object} CollapsiblePanelOptions
 * @property {string} [icon] - Material icon name
 * @property {string} [title] - Panel title
 * @property {Object} [position] - Position with top/bottom/left/right
 * @property {number|null} [badgeCount] - Badge count for notifications
 */

/**
 * @typedef {Object} NavigableListOptions
 * @property {Function} [onItemClick] - Callback when item clicked (item, list) => void
 * @property {Function} [onNavigate] - Callback on navigation (item, direction) => void
 * @property {Function} [renderItem] - Custom item renderer (item, list) => UIElement
 * @property {Function} [getChildren] - Get children from item (item) => array
 * @property {Function} [getLabel] - Get label from item (item) => string
 * @property {Function} [getTitle] - Get title from item (item) => string
 * @property {string} [emptyMessage] - Message when no items
 * @property {boolean} [autoNavigate=true] - Drill into items with children on click
 * @property {string} [icon] - Header icon name
 */

/**
 * @typedef {Object} TreeViewOptions
 * @property {Function} [onItemClick] - Callback when item selected (item, tree) => void
 * @property {Function} [onToggle] - Callback when expand/collapse (item, expanded, tree) => void
 * @property {Function} [renderItem] - Custom item renderer (item, tree, depth) => UIElement
 * @property {Function} [getChildren] - Get children from item (item) => array
 * @property {Function} [getLabel] - Get label from item (item) => string
 * @property {Function} [getId] - Stable id for selection/expand (item) => string|number
 * @property {Function} [isExpanded] - Initial expand predicate (item) => boolean
 * @property {boolean} [expandRoot=true] - Expand root nodes that have children
 * @property {string} [emptyMessage] - Message when no items
 */

/**
 * Collection of factory methods for creating UI components.
 * Use `DrawUI.methodName()` to create components.
 * 
 * @example
 * import { DrawUI } from 'drawui';
 * 
 * const panel = DrawUI.tabPanel({ context, tabId: 'my-panel', tabLabel: 'My Panel' });
 * const row = DrawUI.row().gap('1rem');
 * row.add(DrawUI.button('Click me'));
 */
export class DrawUI {
  /**
   * Create a div element
   * @returns {UIDiv}
   */
  static div() {
    return new UIDiv();
  }

  /**
   * Center a component by adding centered class
   * @param {UIElement} component - Component to center
   * @returns {UIElement}
   */
  static center(component) {
    component.addClass("centered");

    return component;
  }

  /**
   * Create an h1 heading
   * @param {string} [text=''] - Heading text
   * @returns {UIText}
   */
  static h1(text = "") {
    return new UIH1(text);
  }

  /**
   * Create an h2 heading
   * @param {string} [text=''] - Heading text
   * @returns {UIText}
   */
  static h2(text = "") {
    return new UIH2(text);
  }

  /**
   * Create an h3 heading
   * @param {string} [text=''] - Heading text
   * @returns {UIText}
   */
  static h3(text = "") {
    return new UIH3(text);
  }

  /**
   * Create an h4 heading
   * @param {string} [text=''] - Heading text
   * @returns {UIText}
   */
  static h4(text = "") {
    return new UIH4(text);
  }

  /**
   * Create an h5 heading
   * @param {string} [text=''] - Heading text
   * @returns {UIText}
   */
  static h5(text = "") {
    return new UIH5(text);
  }

  /**
   * Create an h6 heading
   * @param {string} [text=''] - Heading text
   * @returns {UIText}
   */
  static h6(text = "") {
    return new UIH6(text);
  }

  /**
   * Create a paragraph element
   * @param {string} [text=''] - Paragraph text
   * @returns {UIText}
   */
  static paragraph(text = "") {
    return new UIParagraph(text);
  }


  /**
   * Creates a spinner component.
   * @param {Object} options - Options for the spinner.
   * @param {string} options.text - Text to display with the spinner.
   * @returns {UISpinner} The spinner component.
   */
  static spinner(options = {}) {
    return new UISpinner(options);
  }

  static tooltip(text = '', options = {}) {
    return new UITooltip(text, options);
  }

  /**
   * Creates a text component.
   * @param {string} text - The text content.
   * @returns {UIText} The text component.
   */
  static text(text = "") {
    return new UIText(text);
  }

  /**
   * Creates a small text component.
   * @param {string} text - The text content.
   * @returns {UISmallText} The small text component.
   */
  static smallText(text = "") {
    return new UISmallText(text);
  }

  /**
   * Creates a title component.
   * @param {string} text - The title text.
   * @returns {UIText} The title component.
   */
  static title(text = "") {
    const element = new UIText(text).addClass("Title");

    return element;
  }

  /**
   * Create a disclaimer text element
   * @param {string} [text=''] - Disclaimer text
   * @returns {UIText}
   */
  static disclaimer(text = "") {
    const element = new UIText(text);

    element.setClass("disclaimer");

    return element;
  }

  /**
   * Create an inline code / API signature element
   * @param {string} [text=''] - Code text
   * @returns {UISpan}
   */
  static code(text = "") {
    const element = new UISpan();

    element.setClass("Code");
    element.setTextContent(text);

    return element;
  }

  /**
   * Create a listbox container
   * @returns {UIListbox}
   */
  static list() {
    return new UIListbox();
  }

  /**
   * Create a drag handle element
   * @param {string} [type='drag'] - Handle type
   * @returns {HTMLSpanElement}
   */
  static handle(type = "drag") {
    const handle = document.createElement("span");

    handle.className = `${type}-handle`;

    return handle;
  }

  /**
   * Create a reorderable list
   * @param {Array} [items=[]] - Initial items
   * @param {Function|null} [onReorder=null] - Callback when items reordered
   * @returns {UIElement}
   */
  static reorderableList(items = [], onReorder = null) {
    const reorderableList = new ReorderableList(items, onReorder);

    return reorderableList.container;
  }

  /**
   * Create a list item
   * @param {string} [text=''] - Item text
   * @returns {ListboxItem}
   */
  static listItem(text = "") {
    const item = new ListboxItem();

    item.addClass("Row");
    if (text) {
      item.setTextContent(text);
    }

    return item;
  }

  static propertyTable(options = {}) {
    return new PropertyTable(options);
  }

  static propertyRow(rowOrLabel, value, tooltip = "") {
    return new PropertyRow(rowOrLabel, value, tooltip);
  }

  /**
   * Create a badge element
   * @param {string} [text=''] - Badge text
   * @returns {UIText}
   */
  static badge(text = "") {
    const element = new UIText(text);

    element.addClass("Badge");

    return element;
  }

  static toast(message, type = 'info', options = {}) {
    const duration = options.duration ?? 5000;
    const dismissible = options.dismissible ?? true;

    const iconMap = { success: 'check_circle', warning: 'warning', error: 'error', info: 'info' };

    const toast = new UIRow();
    toast.addClass("Toast");
    if (type) {
      toast.addClass(`Toast--${type}`);
    }

    const icon = new UIIcon(iconMap[type] || 'info');
    toast.add(icon);

    const text = new UIText();
    text.dom.textContent = message;
    toast.add(text);

    if (dismissible) {
      const close = new UIDiv();
      close.dom = document.createElement('button');
      close.dom.className = 'Toast-close';
      close.dom.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">close</span>';
      close.dom.addEventListener('click', () => toast.dom.remove());
      toast.add(close);
    }

    toast.showIn = function(container) {
      if (!container) return toast;
      const host = container.dom || container;
      const prev = host.querySelector('.Toast');
      if (prev) prev.remove();
      host.prepend(toast.dom);
      return toast;
    };

    // Auto-mount so gallery / simple callers show feedback without showIn()
    if (typeof document !== "undefined" && document.body) {
      document.body.appendChild(toast.dom);
    }

    if (duration > 0) {
      setTimeout(() => {
        toast.dom.classList.add('Toast--fade-out');
        setTimeout(() => toast.dom.remove(), 300);
      }, duration);
    }

    return toast;
  }

  static floatingWindow(options = {}) {
    return new SimpleFloatingWindow(options);
  }

  /**
   * Create a select dropdown
   * @returns {UISelect}
   */
  static select() {
    return new UISelect();
  }

  /**
   * Create a flex row container
   * @returns {UIRow}
   */
  static row() {
    const row = new UIRow();

    row.setDisplay("flex");

    return row;
  }

  /**
   * Create a column layout container
   * @returns {UIDiv}
   */
  static column() {
    const column = new UIDiv();

    column.setClass("Column");

    return column;
  }

  /**
   * Create a grid layout container.
   * @returns {UIGrid}
   */
  static grid() {
    return new UIGrid();
  }

  /**
   * Create a material icon
   * @param {string} [name=''] - Material icon name
   * @returns {UIIcon}
   */
  static icon(name = "") {
    return new UIIcon(name);
  }

  /**
   * Create an operator button (icon with Operator class)
   * @param {string} [name=''] - Material icon name
   * @returns {UIIcon}
   */
  static operator(name = "") {
    const op = new UIDiv();

    op.addClass("Operator");

    const icon = DrawUI.icon(name);

    op.add(icon);

    op.setIcon = (name) => {
      icon.setName(name);
    };

    return op;
  }

  /**
   * Create a link element
   * @param {string} [text=''] - Link text
   * @param {string} [path=''] - Link URL
   * @param {string} [icon] - Optional icon name
   * @param {boolean} [external=true] - Open in new tab
   * @returns {UILink}
   */
  static link(text = "", path = "", icon, external = true) {
    return new UILink(text, path, icon, external);
  }

  /**
   * Create an image element
   * @param {string} [path=''] - Image source path
   * @param {{width: string, height: string}} [size] - Optional size
   * @returns {UIImage}
   */
  static image(path = "", size) {
    const img = new UIImage(path);

    if (size) img.setsize(size.width, size.height);

    return img;
  }

  /**
   * Create an SVG element that loads from path
   * @param {string} [path=''] - SVG file path
   * @param {{width: string, height: string}} [size] - Optional size
   * @returns {UISVG}
   */
  static svg(path = "", size) {
    const svg = new UISVG(path);

    if (size) svg.setsize(size.width, size.height);

    return svg;
  }

  /**
   * Create a span element
   * @param {string} [text=''] - Span text content
   * @returns {UISpan}
   */
  static span(text = "") {
    const span = new UISpan();

    if (text) span.setTextContent(text);

    return span;
  }

  /**
   * Create a keyboard key element
   * @param {string} [key=''] - Key text
   * @returns {UISpan}
   */
  static kbd(key = "") {
    const kbd = new UISpan();

    kbd.setClass("kbd");

    kbd.setTextContent(key);

    return kbd;
  }

  /**
   * Create a horizontal divider
   * @returns {UIHorizontalRule}
   */
  static divider() {
    return new UIHorizontalRule();
  }

  /**
   * Create a vertical spacer
   * @param {string} [size='8px'] - Spacer height
   * @returns {UIDiv}
   */
  static spacer(size = "8px") {
    const spacer = new UIDiv();

    spacer.setHeight(size);

    return spacer;
  }

  /**
   * Create a horizontal spacer
   * @param {string} [size='8px'] - Spacer width
   * @returns {UISpan}
   */
  static hspacer(size = "8px") {
    const spacer = new UISpan();

    spacer.setWidth(size);

    spacer.dom.style.display = "inline-block";

    return spacer;
  }

  /**
   * Create a number input
   * @param {number} [value=0] - Initial value
   * @returns {UINumber}
   */
  static number(value = 0) {
    return new UINumber(value);
  }

  /**
   * Create an integer input
   * @param {number} [value=0] - Initial value
   * @returns {UIInteger}
   */
  static integer(value = 0) {
    return new UIInteger(value);
  }

  /**
   * Create a number slider (range track + numeric field)
   * @param {number} [value=0] - Initial value
   * @returns {UISlider}
   */
  static slider(value = 0) {
    return new UISlider(value);
  }

  /**
   * Create a color picker
   * @returns {UIColor}
   */
  static color() {
    return new UIColor();
  }

  /**
   * Create a progress bar
   * @param {number} [value=0] - Initial progress value (0-100)
   * @returns {UIProgress}
   */
  static progress(value = 0) {
    return new UIProgress(value);
  }

  /**
   * Create a textarea
   * @returns {UITextArea}
   */
  static textarea() {
    return new UITextArea();
  }

  /**
   * Create a tabbed panel container
   * @returns {UITabbedPanel}
   */
  static tabbedPanel() {
    return new UITabbedPanel();
  }

  /**
   * Create a line break
   * @returns {UIBreak}
   */
  static lineBreak() {
    return new UIBreak();
  }

  static instructionLine(keyText, description) {
    const line = new UIRow();

    line.setStyle("alignItems", ["center"]);

    line.setStyle("display", ["flex"]);

    line.gap("8px");

    const kbd = DrawUI.kbd(keyText);

    const desc = new UISpan();

    desc.setTextContent(description);

    line.add(kbd);

    line.add(desc);

    return line;
  }

  static instructionPanel(title, iconName, instructions = []) {
    const panel = new UIDiv();

    panel.setStyle("background", ["var(--glass-surface)"]);

    panel.setStyle("border", ["1px solid var(--border)"]);

    panel.setStyle("borderRadius", ["var(--dui-radius)"]);

    panel.setStyle("overflow", ["hidden"]);

    const header = new UIRow();

    header.setStyle("alignItems", ["center"]);

    header.setStyle("background", ["var(--glass-surface)"]);

    header.setStyle("borderBottom", ["1px solid var(--border)"]);

    header.setStyle("display", ["flex"]);

    header.setStyle("gap", ["8px"]);

    header.setStyle("padding", ["12px 16px"]);

    const icon = new UIIcon(iconName);

    icon.setStyle("color", ["var(--brand-color)"]);

    icon.setStyle("fontSize", ["20px"]);

    const titleText = new UIText(title);

    titleText.setStyle("color", ["var(--theme-text-light)"]);

    titleText.setStyle("fontWeight", ["600"]);

    header.add(icon);

    header.add(titleText);

    panel.add(header);

    const content = DrawUI.column().gap("var(--phi-0-5)").padding("var(--phi-0-5)");

    instructions.forEach((row) => {
      const key = Array.isArray(row) ? row[0] : row.key;
      const desc = Array.isArray(row) ? row[1] : row.desc;
      const line = DrawUI.instructionLine(key, desc);

      content.add(line);
    });

    panel.add(content);

    return panel;
  }

  static labeledBoxItem(data, iconMap) {
    const item = new ListboxItem();

    item.addClass("workspace-menu-item");

    const checkbox = new UICheckbox(data.checked);

    const iconName = iconMap[data.id] || iconMap["default"];
    const icon = new UIIcon(iconName);
    icon.addClass("workspace-menu-item-icon");

    const label = new UIText(data.label);
    label.addClass("workspace-menu-item-label");

    const actions = new UIDiv();
    actions.addClass("workspace-menu-item-actions");

    item.add(checkbox);
    item.add(icon);
    item.add(label);
    item.add(actions);

    return item;
  }

  /**
   * Create a date picker
   * @param {Date} [date] - Initial date
   * @returns {UIDatePicker}
   */
  static date(date) {
    return new UIDatePicker(date);
  }

  /**
   * Create a button
   * @param {string} [text=''] - Button text
   * @returns {UIButton}
   */
  static button(text = "") {
    return new UIButton(text);
  }

  /**
   * Create a square button with icon, label, and optional meta text.
   * @param {string} [label=''] - Primary label
   * @param {{ icon?: string, meta?: string, active?: boolean }} [options={}]
   * @returns {UISquareButton}
   */
  static squareButton(label = "", options = {}) {
    return new UISquareButton(label, options);
  }

  /**
   * Create a text input
   * @returns {UIInput}
   */
  static input() {
    return new UIInput();
  }

  /**
   * Apply the shared compact field treatment to an existing control.
   * @param {UIElement} control - The control to style
   * @param {Object} [extraStyles={}] - Extra style overrides
   * @returns {UIElement}
   */
  static compactField(control, extraStyles = {}) {
    return styleCompactField(control, extraStyles);
  }

  /**
   * Create a compact button with the shared DrawUI button treatment.
   * @param {string} [text=''] - Button label
   * @param {Object} [extraStyles={}] - Extra style overrides
   * @returns {CompactButton}
   */
  static compactButton(text = "", extraStyles = {}) {
    return new CompactButton(text, extraStyles);
  }

  /**
   * Create a search input with the shared DrawUI search treatment.
   * @param {string} [placeholder='Search...'] - Placeholder text
   * @param {Function|null} [onInput=null] - Optional input callback
   * @returns {SearchInput}
   */
  static searchInput(placeholder = "Search...", onInput = null) {
    return new SearchInput(placeholder, onInput);
  }

  /**
   * Create a checkbox
   * @param {boolean} [checked=false] - Initial checked state
   * @returns {UICheckbox}
   */
  static checkbox(checked = false) {
    return new UICheckbox(checked).addClass("Card-checkbox");
  }

  /**
   * Create a panel container
   * @returns {UIPanel}
   */
  static panel() {
    return new UIPanel();
  }

  /**
   * Create a label element
   * @param {string} [text=''] - Label text
   * @returns {UILabel}
   */
  static label(text = '') {
    return new UILabel(text);
  }

  /**
   * Create a form element
   * @returns {UIForm}
   */
  static form() {
    return new UIForm();
  }

  /**
   * Create a card element (panel with Card class)
   * @returns {UIPanel}
   */
  static card() {
    return new UIPanel().addClass("Card");
  }

  /**
   * Creates a basic panel container.
   * @param {Object} [options={}] - Panel configuration
   * @returns {BasePanel} The basic panel component
   */

  static basePanel(options = {}) {
    return new BasePanel(options);
  }

  /**
   * Creates a collapsible panel that shows a badge/button when collapsed
   * and expands to show full content when clicked.
   * @param {CollapsiblePanelOptions} [options={}] - Panel configuration
   * @returns {CollapsiblePanel} The collapsible panel component
   */
  static collapsiblePanel(options = {}) {
    return new CollapsiblePanel(options);
  }

  /**
   * Create a collapsible section
   * @param {Object} [options={}] - Section options
   * @param {string} [options.title] - Section title
   * @param {boolean} [options.collapsed] - Start collapsed
   * @param {string} [options.icon] - Section icon
   * @param {string} [options.className] - Section class name
   * @returns {CollapsibleSection}
   */
  static collapsibleSection(options = {}) {
    return new CollapsibleSection(options);
  }

  /**
   * Create a sidebar and main-panel layout shell.
   * @param {Object} [options={}] - Layout configuration
   * @returns {SidebarLayout}
   */
  static sidebarLayout(options = {}) {
    return new SidebarLayout(options);
  }

  /**
   * Create a single-page app shell with sidebar navigation and hash routing.
   * @param {import('./components/SpaLayout.js').SpaLayoutOptions} [options={}]
   * @returns {SpaLayout}
   * @example
   * const spa = DrawUI.spa({
   *   sidebarTitle: 'Components',
   *   groups: [{
   *     id: 'forms',
   *     label: 'Form controls',
   *     items: [{ id: 'button', label: 'Button', render: () => DrawUI.button('Click') }],
   *   }],
   * });
   * document.body.appendChild(spa.dom);
   * spa.start();
   */
  static spa(options = {}) {
    return new SpaLayout(options);
  }

  static layoutPane(options = {}) {
    return new LayoutPane(options);
  }

  /** @deprecated Use DrawUI.layoutPane() */
  static sidebarLayoutPane(options = {}) {
    return new LayoutPane(options);
  }

  /** @deprecated Use DrawUI.layoutPane() */
  static sidebarPane(options = {}) {
    return new LayoutPane(options);
  }

  /** @deprecated Use DrawUI.layoutPane() */
  static mainPane(options = {}) {
    return new LayoutPane(options);
  }

  /**
   * Creates a tab panel that integrates with the LayoutManager's tabbed layout.
  * Unlike legacy viewport panels, TabPanel registers as a tab
   * in the left, right, or bottom layout panels.
   * 
   * @param {Object} options - Panel configuration
   * @param {Object} options.context - Application context (`context.ui.model.layoutManager`).
   * @param {Object} [options.operators] - Integration with operators.
   * @param {'left'|'right'|'bottom'} [options.position='right'] - Layout position.
   * @param {string} options.tabId - Unique identifier for the tab.
   * @param {string} options.tabLabel - Display label shown in the tab header.
   * @param {string} [options.icon] - Material icon name for the header.
   * @param {string} [options.title] - Panel title displayed in the header.
   * @param {Object} [options.panelStyles={}] - Inline styles on the tab page root when the tab is registered.
   * @param {boolean} [options.showHeader=true] - Whether to display the panel header.
   * @param {boolean} [options.autoShow=false] - Auto-show tab on creation.
   * @param {string} [options.moduleId] - Registers tab (closed) and binds toolbar id from UI WorldComponent.
   * @param {string} [options.toggleElementId] - Explicit DOM id for bindToggle (overrides moduleId lookup).
    * @param {boolean} [options.floatable=false] - Show undock on the workspace tab label.
    * @param {boolean} [options.startFloating=false] - Auto-show as a floating panel before docking.
    * @param {Object} [options.floatingStyles] - Inline styles for the floating panel host.
    * @param {boolean} [options.floatingClosable=true] - Whether the floating host has a close button.
   * @returns {TabPanel} The tab panel component
   * 
   * @example
   * const panel = DrawUI.tabPanel({
   *   context,
   *   position: 'right',
   *   tabId: 'settings',
   *   tabLabel: 'Settings',
   *   icon: 'settings'
   * });
   * panel.content.add(DrawUI.text('Settings content'));
   * panel.show();
   */
  static tabPanel(options = {}) {
    return new TabPanel(options);
  }

  /**
   * Creates a navigable list component with back/forth navigation.
   * Useful for hierarchical data browsing.
   * @param {NavigableListOptions} [options={}] - List configuration
   * @returns {DrillDownUpList} The navigable list component
   * @example
   * const list = DrawUI.drillDownUpList({
   *   onItemClick: (item) => console.log('Selected:', item),
   *   getLabel: (item) => item.name,
   *   getChildren: (item) => item.children || []
   * });
   * list.setData(treeData);
   */
  static drillDownUpList(options = {}) {
    return new DrillDownUpList(options);
  }

  /**
   * Creates an expandable nested tree for hierarchical data.
   * Uses the same getChildren/getLabel options shape as drillDownUpList.
   * @param {TreeViewOptions} [options={}] - Tree configuration
   * @returns {TreeView} The tree view component
   */
  static treeView(options = {}) {
    return new TreeView(options);
  }

  /**
   * Create a split container for resizable layouts
   * @param {'horizontal'|'vertical'} direction - Split direction
   * @param {UIElement[]} [children=[]] - Child elements
   * @returns {UIDiv}
   */
  static splitContainer(direction, children = []) {
    const container = new UIDiv();

    container.setClass("split-container");

    container.dom.style.display = "flex";

    container.dom.style.flexDirection =
      direction === "horizontal" ? "row" : "column";

    container.dom.style.flex = "1";

    container.dom.style.gap = "0";

    children.forEach((child) => {
      if (child.dom) {
        container.add(child);
      } else {
        container.dom.appendChild(child);
      }
    });

    return container;
  }

  static flexResizer(splitNode, childIndex) {
    const resizer = new UIDiv();

    resizer.setClass(
      `layout-resizer layout-resizer-${splitNode.direction === "horizontal" ? "right" : "bottom"}`
    );

    resizer.dom.dataset.splitId = splitNode.id || "root";

    resizer.dom.dataset.childIndex = childIndex;

    resizer.dom.dataset.direction = splitNode.direction;

    return resizer;
  }

  /**
   * Create a layout resizer handle for split panes.
   * @param {'left'|'right'|'bottom'} [placement='right']
   * @returns {UIDiv}
   */
  static layoutResizer(placement = "right") {
    const resizer = new UIDiv();
    resizer.setClass(`layout-resizer layout-resizer-${placement}`);
    resizer.dom.setAttribute("role", "separator");
    resizer.dom.setAttribute(
      "aria-orientation",
      placement === "bottom" ? "horizontal" : "vertical"
    );

    return resizer;
  }

  /**
   * Renders markdown with the built-in converter, or sanitizes HTML input.
   * @param {string} [text=''] - Markdown or HTML text
   * @param {Object} [options={}]
   * @param {boolean} [options.isMarkdown] - Force markdown or HTML mode; inferred when omitted
   * @returns {UIDiv}
   */
  static markdown(text = "", options = {}) {
    const raw = String(text).trim();
    const explicitMarkdown = options.isMarkdown === true;
    const explicitHtml = options.isMarkdown === false;
    const looksLikeHtml = raw.startsWith("<");
    const isMarkdown = explicitMarkdown || (!explicitHtml && !looksLikeHtml);

    const div = new UIDiv();
    div.addClass("Markdown");

    if (isMarkdown) {
      const { html } = simpleMarkdownToHtml(text);
      div.setInnerHTML(sanitizeHtml(html));
    } else {
      div.setInnerHTML(sanitizeHtml(text));
    }

    return div;
  }
}

// https://fonts.google.com/icons

export { ICONS } from "./icons.js";

// Re-export panel components for convenience
export { BasePanel, SimpleFloatingWindow } from "./layout/BasePanel.js";
export { TabPanel } from "./layout/TabPanel.js";
export { PanelHeader, PanelFooter, LayoutPane } from "./layout/index.js";
export { FloatingPanel } from "./overlays/FloatingPanel.js";
export { CollapsiblePanel } from "./components/CollapsiblePanel.js";
export { CollapsibleSection } from "./components/CollapsibleSection.js";
export { DayNightCheckBox } from "./components/DayNight.js";
export { LoadingBar } from "./components/LoadingBar.js";
export { PropertyTable, PropertyRow } from "./components/PropertyTable.js";
export { Nodes } from "./components/Nodes.js";
export { ReorderableList } from "./components/ReorderableList.js";
export { TreeView } from "./components/TreeView.js";
export { SidebarLayout } from "./components/SidebarLayout.js";
export { SpaLayout } from "./components/SpaLayout.js";
export {
  hideProgressBar,
  showProgressBar,
  updateProgressBar,
} from "./components/progressBar.js";

// Re-export utility functions
export { buildWorkspaceDockHandlers } from "./utils/workspace-panel-dock.js";
export { makeDraggable, makeResizable } from "./utils/panel-resizer.js";
export { makeLayoutResizer } from "./utils/layout-resizer.js";

// Re-export all UI primitives from ui.js
export {
  UIElement,
  UILink,
  UIImage,
  UISVG,
  UIParagraph,
  UIH1,
  UIH2,
  UIH3,
  UIH4,
  UIH5,
  UIH6,
  UISpan,
  UIDiv,
  UIRow,
  UIColumn,
  UIPanel,
  UILabel,
  UIForm,
  UIText,
  UISmallText,
  UIInput,
  UIIcon,
  UITextArea,
  UISelect,
  UICheckbox,
  UIColor,
  UINumber,
  UIInteger,
  UISlider,
  UIBreak,
  UIHorizontalRule,
  UIButton,
  UISquareButton,
  UIProgress,
  UITabbedPanel,
  UIGrid,
  UIListbox,
  ListboxItem,
  UIDatePicker,
  UISpinner,
  UITooltip,
} from "./primitives/ui.js";
