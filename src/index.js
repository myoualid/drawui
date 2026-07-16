// @ts-nocheck
// Full public entry — includes peer-dependent components (chart, spreadsheet, gantt, Showdown markdown).

import { DrawUI as DrawUICore } from "./core.js";
import { UIDiv } from "./primitives/ui.js";
import { ChartUIComponent } from "./components/ChartUIComponent.js";
import { MarkdownComponent } from "./components/MarkdownComponent.js";
import { SpreadsheetUIComponent } from "./components/SpreadsheetUIComponent.js";
import { sanitizeHtml } from "./utils/markdown.js";

/**
 * @typedef {Object} SpreadsheetOptions
 * @property {Array<Array<any>>} [data] - Initial data
 * @property {Array<{header: string, type?: string}>} [columnConfig] - Column configuration
 * @property {Function} [columnNameMapper] - Map column names
 * @property {string} [height] - Container height
 * @property {string} [width] - Container width
 */

export class DrawUI extends DrawUICore {
  /**
   * Creates a markdown component that renders markdown with Showdown or sanitizes HTML.
   * @param {string} [text=''] - The markdown or HTML text to render
   * @param {Object} [options={}] - Options for rendering
   * @param {boolean} [options.isMarkdown] - True to treat as markdown (Showdown); false to treat as HTML. If omitted, inferred (content starting with '<' is HTML).
   * @param {Function} [options.highlightCallback] - Callback for code highlighting
   * @returns {UIDiv} The rendered markdown component
   */
  static markdown(text = "", options = {}) {
    const raw = String(text).trim();
    const explicitMarkdown = options.isMarkdown === true;
    const explicitHtml = options.isMarkdown === false;
    const looksLikeHtml = raw.startsWith("<");
    const isMarkdown = explicitMarkdown || (!explicitHtml && !looksLikeHtml);

    if (isMarkdown) {
      return new MarkdownComponent(text, options);
    }

    const div = new UIDiv();
    div.setInnerHTML(sanitizeHtml(text));
    div.addClass("Markdown");

    return div;
  }

  /**
   * Create a Chart.js panel.
   * @param {Object} [options={}]
   * @param {Object} options.chartConfiguration - Chart.js configuration.
   * @param {string} [options.height]
   * @param {string} [options.width]
   * @param {string} [options.minHeight]
   * @returns {ChartUIComponent}
   */
  static chart({
    chartConfiguration,
    height = "240px",
    width = "100%",
    minHeight,
  } = {}) {
    return new ChartUIComponent({
      chartConfiguration,
      height,
      width,
      minHeight,
    });
  }

  /**
   * Create a spreadsheet component
   * @param {SpreadsheetOptions} options - Spreadsheet configuration
   * @returns {SpreadsheetUIComponent}
   */
  static spreadsheet({
    data,
    columnConfig,
    columnNameMapper,
    height = "100%",
    width = "100%",
  }) {
    return new SpreadsheetUIComponent({
      data,
      columnConfig,
      columnNameMapper,
      height,
      width,
    });
  }
}

export {
  ICONS,
  BasePanel,
  SimpleFloatingWindow,
  TabPanel,
  PanelHeader,
  PanelFooter,
  FloatingPanel,
  CollapsiblePanel,
  CollapsibleSection,
  DayNightCheckBox,
  LoadingBar,
  PropertyTable,
  PropertyRow,
  Nodes,
  ReorderableList,
  TreeView,
  SidebarLayout,
  LayoutPane,
  SpaLayout,
  hideProgressBar,
  showProgressBar,
  updateProgressBar,
  buildWorkspaceDockHandlers,
  makeDraggable,
  makeResizable,
  makeLayoutResizer,
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
} from "./core.js";

export { ChartUIComponent } from "./components/ChartUIComponent.js";
export { GanttComponent } from "./components/GanttComponent.js";
export { MarkdownComponent, markdownToHtml } from "./components/MarkdownComponent.js";
export { SpreadsheetUIComponent } from "./components/SpreadsheetUIComponent.js";
