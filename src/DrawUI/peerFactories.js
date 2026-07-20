// Peer-dependent DrawUI factories (Chart.js, ag-grid).

import { Chart } from "../components/peer/Chart.js";
import { DataGrid } from "../components/peer/DataGrid.js";

/**
 * @typedef {Object} SpreadsheetOptions
 * @property {Array<Array<any>>} [data]
 * @property {Array<{header: string, type?: string}>} [columnConfig]
 * @property {Function} [columnNameMapper]
 * @property {string} [height]
 * @property {string} [width]
 */

/**
 * @param {Object} [options={}]
 * @param {Object} options.chartConfiguration
 * @param {string} [options.height]
 * @param {string} [options.width]
 * @param {string} [options.minHeight]
 * @returns {Chart}
 * @category Facade
 */
export function createChart({
  chartConfiguration,
  height = "240px",
  width = "100%",
  minHeight,
} = {}) {
  return new Chart({
    chartConfiguration,
    height,
    width,
    minHeight,
  });
}

/**
 * @param {SpreadsheetOptions} options
 * @returns {DataGrid}
 * @category Facade
 */
export function createSpreadsheet({
  data,
  columnConfig,
  columnNameMapper,
  height = "100%",
  width = "100%",
}) {
  return new DataGrid({
    data,
    columnConfig,
    columnNameMapper,
    height,
    width,
  });
}
