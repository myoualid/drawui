// @ts-nocheck
// Generated factories: GUI.Button() === new Button().
// Component factories use PascalCase; utility helpers (center) stay camelCase.
import * as P from "../primitives/index.js";
import * as C from "../components/index.js";
import { Markdown } from "../components/Markdown.js";
import { FloatingWindow } from "../overlays/FloatingWindow.js";

/**
 * UI component facade. Does not include workspace layout management.
 *
 * @example
 * import { Button, StackPanel, Badge } from "@aeco-dev/gui";
 * new StackPanel({ isVertical: false }).add(new Button("Save")).add(new Badge("New"));
 *
 * @example <caption>Basic</caption>
 * // live
 * return new StackPanel({ isVertical: false })
 *   .gap("0.5rem")
 *   .add(new Button("Save"))
 *   .add(new Badge("New"));
 *
 * @category Facade
 */
export class GUI {}

/** @type {Record<string, new (...args: any[]) => any>} */
const ctors = {
  Button: P.Button,
  Icon: P.Icon,
  Text: P.Text,
  Caption: P.Caption,
  Title: P.Title,
  Disclaimer: P.Disclaimer,
  Heading: P.Heading,
  Code: P.Code,
  Kbd: P.Kbd,
  Badge: P.Badge,
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
  LoadingCube: P.LoadingCube,
  Tooltip: P.Tooltip,
  TabView: P.TabView,
  Toast: C.Toast,
  Markdown,
  Operator: C.Operator,
  LabeledBoxItem: C.LabeledBoxItem,
  SplitContainer: C.SplitContainer,
  Panel: C.Panel,
  FloatingDialog: C.FloatingDialog,
  CollapsiblePanel: C.CollapsiblePanel,
  RibbonBar: C.RibbonBar,
  Flyout: C.Flyout,
  NavigationView: C.NavigationView,
  AppShell: C.AppShell,
  RadialMenu: C.RadialMenu,
  NavigationList: C.NavigationList,
  TreeView: C.TreeView,
  PropertyGrid: C.PropertyGrid,
  PropertyGridRow: C.PropertyGridRow,
  SortableList: C.SortableList,
  FloatingWindow,
};

for (const [name, Ctor] of Object.entries(ctors)) {
  GUI[name] = (...args) => new Ctor(...args);
}

GUI.Row = () => new P.StackPanel({ isVertical: false });
GUI.Column = () => new P.StackPanel({ isVertical: true });
GUI.center = P.center;
for (let level = 1; level <= 6; level += 1) {
  GUI[`H${level}`] = (text = "") => new P.Heading(level, text);
}
