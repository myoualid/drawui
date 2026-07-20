import { DrawUI as DrawUICore } from "../DrawUI/DrawUI.js";
import {
  createChart,
  createSpreadsheet,
} from "../DrawUI/peerFactories.js";
import { Markdown } from "../components/peer/Markdown.js";

/**
 * Full facade: core factories plus peer Chart / Spreadsheet / Markdown.
 * See {@link DrawUI} in `src/DrawUI/DrawUI.js` for usage examples.
 * @category Facade
 */
export class DrawUI extends DrawUICore {
  static Markdown = (...args) => new Markdown(...args);
  static Chart = createChart;
  static Spreadsheet = createSpreadsheet;
}

/** Spreadsheet factory alias (returns DataGrid). */
export const Spreadsheet = createSpreadsheet;

export * from "../exports/shared.js";
export * from "../components/peer/index.js";
