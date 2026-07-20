// @ts-nocheck
// Generated factories: DrawUI.Button() === new Button().
// Component factories use PascalCase; utility helpers (center) stay camelCase.
// Full bundle adds Chart / Spreadsheet peer factories.

import * as P from "../primitives/index.js";
import * as C from "../components/index.js";
import { Markdown } from "../components/Markdown.js";
import { WorkspaceLayout } from "../workspace/index.js";

/**
 * Facade with generated constructors + peer factories on the full build.
 *
 * @example
 * DrawUI.Button("Save");
 * DrawUI.Column().add(DrawUI.Badge("New"));
 *
 * @example <caption>Basic</caption>
 * // live
 * return new StackPanel({ isVertical: false })
 *   .gap("0.5rem")
 *   .add(DrawUI.Button("Save"))
 *   .add(DrawUI.Badge("New"));
 *
 * @category Facade
 */
export class DrawUI {}

/** @type {Record<string, new (...args: any[]) => any>} */
const ctors = {
  Button: P.Button,
  IconButton: P.IconButton,
  RibbonButton: P.RibbonButton,
  Icon: P.Icon,
  TextBlock: P.TextBlock,
  Caption: P.Caption,
  Title: P.Title,
  Disclaimer: P.Disclaimer,
  Paragraph: P.Paragraph,
  Heading: P.Heading,
  Span: P.Span,
  Code: P.Code,
  Kbd: P.Kbd,
  Badge: P.Badge,
  Label: P.Label,
  Form: P.Form,
  Hyperlink: P.Hyperlink,
  Image: P.Image,
  Svg: P.Svg,
  Canvas: P.Canvas,
  Container: P.Container,
  StackPanel: P.StackPanel,
  ScrollViewer: P.ScrollViewer,
  Grid: P.Grid,
  Rectangle: P.Rectangle,
  Card: P.Card,
  Spacer: P.Spacer,
  HSpacer: P.HSpacer,
  Handle: P.Handle,
  Line: P.Line,
  LineBreak: P.LineBreak,
  InputText: P.InputText,
  InputTextArea: P.InputTextArea,
  InputSearch: P.InputSearch,
  InputDropdown: P.InputDropdown,
  Checkbox: P.Checkbox,
  InputColor: P.InputColor,
  InputNumber: P.InputNumber,
  InputInteger: P.InputInteger,
  Slider: P.Slider,
  InputDate: P.InputDate,
  List: P.InputList,
  ListItem: P.InputListItem,
  ProgressBar: P.ProgressBar,
  ProgressRing: P.ProgressRing,
  Tooltip: P.Tooltip,
  TabView: P.TabView,
  Toast: C.Toast,
  Markdown,
  Operator: C.Operator,
  InstructionLine: C.InstructionLine,
  InstructionPanel: C.InstructionPanel,
  LabeledBoxItem: C.LabeledBoxItem,
  SplitContainer: C.SplitContainer,
  ContentPanel: C.ContentPanel,
  FloatingDialog: C.FloatingDialog,
  CollapsiblePanel: C.CollapsiblePanel,
  WorkspacePanel: C.WorkspacePanel,
  Header: C.Header,
  RibbonBar: C.RibbonBar,
  Flyout: C.Flyout,
  NavigationView: C.NavigationView,
  NavigationList: C.NavigationList,
  TreeView: C.TreeView,
  AppShell: C.AppShell,
  PropertyGrid: C.PropertyGrid,
  PropertyGridRow: C.PropertyGridRow,
  SortableList: C.SortableList,
  ToolbarButton: C.ToolbarButton,
  WorkspaceLayout: WorkspaceLayout,
};

for (const [name, Ctor] of Object.entries(ctors)) {
  DrawUI[name] = (...args) => new Ctor(...args);
}

DrawUI.Row = () => new P.StackPanel({ isVertical: false });
DrawUI.Column = () => new P.StackPanel({ isVertical: true });
DrawUI.center = P.center;
for (let level = 1; level <= 6; level += 1) {
  DrawUI[`H${level}`] = (text = "") => new P.Heading(level, text);
}
