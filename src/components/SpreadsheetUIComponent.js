import {
    createGrid,
    ModuleRegistry,
    AllCommunityModule,
    provideGlobalGridOptions,
} from "ag-grid-community";

import { UIPanel, UIDatePicker } from "../primitives/ui.js";

let agGridModulesRegistered = false;

function ensureAgGridModulesRegistered() {
    if (agGridModulesRegistered) {
        return;
    }

    // Must run before createGrid: v33+ defaults to Theming API (themeQuartz) and
    // conflicts with ag-grid.css / ag-theme-*.css (error #239) unless theme is legacy.
    provideGlobalGridOptions({ theme: "legacy" });
    ModuleRegistry.registerModules([AllCommunityModule]);
    agGridModulesRegistered = true;
}

function normalizeRowSelection(rowSelection) {
    if (!rowSelection) {
        return { mode: "singleRow" };
    }

    if (typeof rowSelection === "string") {
        if (rowSelection === "multiple") {
            return { mode: "multiRow" };
        }

        if (rowSelection === "single") {
            return { mode: "singleRow" };
        }
    }

    return rowSelection;
}

function resolveAgGridThemeClass() {
    const theme = document.documentElement?.getAttribute?.("data-theme");
    return theme === "light" ? "ag-theme-quartz" : "ag-theme-quartz-dark";
}

function defaultDateFormatter(value) {
    if (!value) {
        return "";
    }

    const parsedDate = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        return String(value);
    }

    return parsedDate.toLocaleString();
}

class SpreadsheetUIComponent extends UIPanel {
    constructor(options = {}) {
        super();

        this.dateFormatter = options.dateFormatter || defaultDateFormatter;

        this.setClass("spreadsheet-component");
        this.dom.className = `${resolveAgGridThemeClass()} ag-grid-container spreadsheet-component`;
        this.dom.style.width = options.width || "100%";
        this.dom.style.height = options.height || "400px";

        if (options.minHeight) {
            this.dom.style.minHeight = options.minHeight;
        }

        this.dom.style.boxSizing = "border-box";

        this.rawData = options.data || [];
        this.columnConfig = options.columnConfig || {};
        this.columnOrder = options.columnOrder || null;
        this.columnNameMapper = options.columnNameMapper || {};
        this.gridApi = null;
        this.gridColumnApi = null;
        this.columnTypes = {};
        this.lastSelection = null;
        this._themeObserver = null;
        this.bindThemeObserver();

        const columnDefs = this.deriveColumnDefs(this.rawData);

        // ag-grid v33+ defaults to the JS Theming API (light Quartz) and ignores
        // ag-theme-* classes unless theme is "legacy". Keep class-based theming so
        // day/night CSS in ag-grid-custom.css continues to work.
        const userGridOptions = options.gridOptions || {};

        this.gridOptions = {
            rowData: this.rawData,
            columnDefs,
            components: {
                dateTimePicker: this.getDateTimeCellEditor(),
            },
            defaultColDef: {
                editable: true,
                sortable: true,
                filter: true,
                resizable: true,
                minWidth: 120,
            },
            domLayout: userGridOptions.domLayout || "normal",
            enableCellTextSelection: true,
            suppressMenuHide: false,
            suppressColumnVirtualisation: false,
            animateRows: true,
            rowSelection: { mode: "singleRow" },
            onSelectionChanged: () => this.handleSelectionChanged(),
            onCellValueChanged: (event) => this.handleCellValueChanged(event),
            ...userGridOptions,
            theme: userGridOptions.theme ?? "legacy",
        };

        this.gridOptions.rowSelection = normalizeRowSelection(this.gridOptions.rowSelection);
    }

    loadDependencies() {
        ensureAgGridModulesRegistered();
        return Promise.resolve();
    }

    syncThemeClass() {
        const nextTheme = resolveAgGridThemeClass();
        this.dom.classList.remove("ag-theme-quartz", "ag-theme-quartz-dark");
        this.dom.classList.add(nextTheme);
    }

    bindThemeObserver() {
        if (typeof MutationObserver !== "function" || !document.documentElement) {
            return;
        }

        this._themeObserver = new MutationObserver(() => {
            this.syncThemeClass();
        });

        this._themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });
    }

    getDateTimeCellEditor() {
        function DateTimeCellEditor() {}

        DateTimeCellEditor.prototype.init = function (params) {
            this.params = params;
            this.value = params.value;
            this.container = document.createElement("div");
            this.container.style.width = "100%";
            this.container.style.height = "100%";

            this.input = document.createElement("input");
            this.input.type = "text";
            this.input.style.width = "100%";
            this.input.style.height = "100%";
            this.input.style.border = "none";
            this.input.style.outline = "none";
            this.input.style.padding = "0 4px";
            this.input.style.boxSizing = "border-box";

            if (this.value) {
                const parsedDate = new Date(this.value);

                if (!Number.isNaN(parsedDate.getTime())) {
                    this.input.value = parsedDate.toLocaleString();
                }
            }

            this.container.appendChild(this.input);

            this.datePicker = new UIDatePicker(this.value);
            this.datePicker.setIncludeTime(true);
            this.datePicker.hideCalendar();
            this.datePicker.dom.style.position = "absolute";
            this.datePicker.dom.style.zIndex = "9999";
            this.datePicker.dom.style.display = "none";
            document.body.appendChild(this.datePicker.dom);

            this.input.addEventListener("focus", () => {
                this.showDatePicker();
            });

            this.input.addEventListener("click", () => {
                this.showDatePicker();
            });

            this.datePicker.dom.addEventListener("change", () => {
                const selectedDate = this.datePicker.getValue();

                if (!(selectedDate instanceof Date) || Number.isNaN(selectedDate.getTime())) {
                    return;
                }

                this.input.value = selectedDate.toLocaleString();
                this.value = selectedDate.toISOString();
            });
        };

        DateTimeCellEditor.prototype.showDatePicker = function () {
            const rect = this.input.getBoundingClientRect();

            this.datePicker.dom.style.left = rect.left + "px";
            this.datePicker.dom.style.top = rect.bottom + 2 + "px";
            this.datePicker.dom.style.display = "block";
            this.datePicker.showCalendar();
        };

        DateTimeCellEditor.prototype.getGui = function () {
            return this.container;
        };

        DateTimeCellEditor.prototype.afterGuiAttached = function () {
            this.input.focus();
        };

        DateTimeCellEditor.prototype.getValue = function () {
            return this.value;
        };

        DateTimeCellEditor.prototype.destroy = function () {
            if (this.datePicker && this.datePicker.dom.parentNode) {
                this.datePicker.dom.parentNode.removeChild(this.datePicker.dom);
            }
        };

        DateTimeCellEditor.prototype.isPopup = function () {
            return true;
        };

        return DateTimeCellEditor;
    }

    deriveColumnDefs(data) {
        if (!data || data.length === 0) {
            return [{ field: "empty", headerName: "No Data", editable: false }];
        }

        const allKeys = new Set();

        data.forEach((row) => {
            if (typeof row === "object" && row !== null) {
                Object.keys(row).forEach((key) => allKeys.add(key));
            }
        });

        let keys = Array.from(allKeys);

        if (this.columnOrder) {
            keys = this.columnOrder.filter((key) => allKeys.has(key));

            allKeys.forEach((key) => {
                if (!this.columnOrder.includes(key)) {
                    keys.push(key);
                }
            });
        }

        return keys.map((field) => {
            const dataType = this.detectDataType(data, field);
            this.columnTypes[field] = dataType;

            const customConfig = this.columnConfig[field] || {};
            const { type: _omitType, ...safeConfig } = customConfig;
            const headerName =
                this.columnNameMapper[field] ||
                customConfig.headerName ||
                this.formatColumnName(field);

            const columnDefinition = {
                field,
                headerName,
                editable: customConfig.editable !== false,
                sortable: true,
                filter: customConfig.filter !== false,
                resizable: true,
                ...safeConfig,
            };

            switch (dataType) {
                case "integer":
                    columnDefinition.filter = "agNumberColumnFilter";
                    columnDefinition.valueFormatter = (params) => {
                        if (params.value === null || params.value === undefined) {
                            return "";
                        }

                        return typeof params.value === "number"
                            ? params.value.toString()
                            : params.value;
                    };
                    break;

                case "float":
                    columnDefinition.filter = "agNumberColumnFilter";
                    columnDefinition.valueFormatter = (params) => {
                        if (params.value === null || params.value === undefined) {
                            return "";
                        }

                        return typeof params.value === "number"
                            ? params.value.toFixed(2)
                            : params.value;
                    };
                    break;

                case "boolean":
                    columnDefinition.filter = "agSetColumnFilter";
                    columnDefinition.cellEditor = "agCheckboxCellEditor";
                    break;

                case "date":
                    columnDefinition.filter = "agDateColumnFilter";
                    columnDefinition.cellEditor = "dateTimePicker";
                    columnDefinition.cellEditorParams = { useFormatter: true };
                    columnDefinition.valueFormatter = (params) => {
                        if (!params.value) {
                            return "";
                        }

                        return this.dateFormatter(params.value) || String(params.value);
                    };
                    columnDefinition.valueParser = (params) => {
                        if (!params.newValue) {
                            return null;
                        }

                        const parsedDate = new Date(params.newValue);
                        return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
                    };
                    break;

                case "object":
                    columnDefinition.filter = "agTextColumnFilter";
                    columnDefinition.valueFormatter = (params) => {
                        if (params.value == null) {
                            return "";
                        }

                        return typeof params.value === "object"
                            ? JSON.stringify(params.value)
                            : String(params.value);
                    };
                    columnDefinition.valueParser = (params) => {
                        if (params.newValue == null || params.newValue === "") {
                            return null;
                        }

                        try {
                            const parsedValue = JSON.parse(params.newValue);
                            return typeof parsedValue === "object" ? parsedValue : params.newValue;
                        } catch {
                            return params.newValue;
                        }
                    };
                    break;

                case "string":
                default:
                    columnDefinition.filter = "agTextColumnFilter";
                    break;
            }

            return columnDefinition;
        });
    }

    detectDataType(data, field) {
        for (let index = 0; index < Math.min(data.length, 5); index++) {
            const value = data[index][field];

            if (value === null || value === undefined) {
                continue;
            }

            if (typeof value === "boolean") {
                return "boolean";
            }

            if (typeof value === "number") {
                return Number.isInteger(value) ? "integer" : "float";
            }

            if (value instanceof Date) {
                return "date";
            }

            if (typeof value === "object") {
                return "object";
            }

            if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                return "date";
            }
        }

        return "string";
    }

    formatColumnName(field) {
        return field
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ")
            .trim();
    }

    init() {
        this.initializeAgGrid();
    }

    initializeAgGrid() {
        ensureAgGridModulesRegistered();

        try {
            this.gridApi = createGrid(this.dom, this.gridOptions);
            this.gridColumnApi = this.gridApi.columnApi || null;
            this.autoSizeColumns();
        } catch (error) {
            this.showErrorMessage("Spreadsheet library failed to load.");

            if (typeof console !== "undefined" && typeof console.error === "function") {
                console.error(error);
            }
        }
    }

    autoSizeColumns() {
        if (!this.gridColumnApi || typeof this.gridColumnApi.getColumns !== "function") {
            return;
        }

        const allColumnIds = [];

        this.gridColumnApi.getColumns()?.forEach((column) => {
            allColumnIds.push(column.colId);
        });

        if (allColumnIds.length > 0 && typeof this.gridColumnApi.autoSizeColumns === "function") {
            this.gridColumnApi.autoSizeColumns(allColumnIds, false);
        }
    }

    showErrorMessage(message) {
        this.dom.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ff6b6b; font-style: italic; font-size: 14px; padding: 20px; text-align: center;">
                ${message}
            </div>
        `;
    }

    loadData(data, config = {}) {
        if (!this.gridApi) {
            return;
        }

        this.rawData = data || [];

        if (config.columnConfig) {
            this.columnConfig = { ...this.columnConfig, ...config.columnConfig };
        }

        if (config.columnNameMapper) {
            this.columnNameMapper = { ...this.columnNameMapper, ...config.columnNameMapper };
        }

        if (config.columnOrder) {
            this.columnOrder = config.columnOrder;
        }

        const newColumnDefs = this.deriveColumnDefs(this.rawData);

        if (typeof this.gridApi.setGridOption === "function") {
            this.gridApi.setGridOption("columnDefs", newColumnDefs);
            this.gridApi.setGridOption("rowData", this.rawData);
        } else if (typeof this.gridApi.updateGridOptions === "function") {
            this.gridApi.updateGridOptions({ columnDefs: newColumnDefs, rowData: this.rawData });
        }

        this.autoSizeColumns();
    }

    getData() {
        if (!this.gridApi) {
            return [];
        }

        const rowData = [];

        this.gridApi.forEachNode((node) => {
            rowData.push(node.data);
        });

        return rowData;
    }

    getFilteredData() {
        if (!this.gridApi) {
            return [];
        }

        const rowData = [];

        this.gridApi.forEachNodeAfterFilter((node) => {
            rowData.push(node.data);
        });

        return rowData;
    }

    getSelected() {
        if (!this.gridApi) {
            return null;
        }

        const selectedNodes = this.gridApi.getSelectedNodes();

        if (selectedNodes.length === 0) {
            return null;
        }

        return {
            nodes: selectedNodes,
            data: selectedNodes.map((node) => node.data),
        };
    }

    getSelectedRows() {
        return this.getSelected()?.data || [];
    }

    getSelectedRow() {
        return this.getSelectedRows()[0] || null;
    }

    selectRow(rowIndex) {
        if (!this.gridApi) {
            return;
        }

        this.gridApi.ensureIndexVisible(rowIndex);
        const node = this.gridApi.getDisplayedRowAtIndex(rowIndex);

        if (node) {
            node.setSelected(true);
            this.gridApi.ensureNodeVisible(node);
        }
    }

    selectRows(rowIndices) {
        if (!this.gridApi) {
            return;
        }

        this.gridApi.deselectAll();

        rowIndices.forEach((index) => {
            const node = this.gridApi.getDisplayedRowAtIndex(index);

            if (node) {
                node.setSelected(true);
            }
        });
    }

    clearSelection() {
        if (this.gridApi) {
            this.gridApi.deselectAll();
        }
    }

    handleSelectionChanged() {
        const selected = this.getSelected();
        this.lastSelection = selected;

        this.dom.dispatchEvent(
            new CustomEvent("selectionChanged", {
                detail: { selected },
            })
        );
    }

    handleCellValueChanged(event) {
        this.dom.dispatchEvent(
            new CustomEvent("cellChanged", {
                detail: {
                    rowData: event.data,
                    field: event.colDef.field,
                    newValue: event.newValue,
                    oldValue: event.oldValue,
                },
            })
        );
    }

    setEditable(editable) {
        if (!this.gridApi) {
            return;
        }

        const columnDefs = this.gridApi.getColumnDefs() || [];

        columnDefs.forEach((columnDefinition) => {
            columnDefinition.editable = editable;
        });

        if (typeof this.gridApi.setGridOption === "function") {
            this.gridApi.setGridOption("columnDefs", columnDefs);
        } else if (typeof this.gridApi.updateGridOptions === "function") {
            this.gridApi.updateGridOptions({ columnDefs });
        }
    }

    applyFilter(field, value, operator = "equals") {
        if (!this.gridApi) {
            return;
        }

        this.gridApi.setFilterModel({
            [field]: { type: operator, filter: value },
        });
    }

    clearFilters() {
        if (this.gridApi) {
            this.gridApi.setFilterModel(null);
        }
    }

    exportAsJson() {
        return JSON.stringify(this.getData(), null, 2);
    }

    exportAsCsv() {
        const data = this.getData();

        if (data.length === 0) {
            return "";
        }

        const keys = Object.keys(data[0]);

        return [
            keys.join(","),
            ...data.map((row) =>
                keys
                    .map((key) => {
                        const value = row[key];

                        if (value === null || value === undefined) {
                            return "";
                        }

                        if (typeof value === "string" && value.includes(",")) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }

                        return value;
                    })
                    .join(",")
            ),
        ].join("\n");
    }

    refresh() {
        if (this.gridApi) {
            this.gridApi.redrawRows();
        }
    }

    updateSettings(settings) {
        if (this.gridApi && typeof this.gridApi.updateGridOptions === "function") {
            this.gridApi.updateGridOptions(settings);
        }
    }

    destroy() {
        if (this._themeObserver) {
            this._themeObserver.disconnect();
            this._themeObserver = null;
        }

        if (this.gridApi) {
            this.gridApi.destroy();
            this.gridApi = null;
            this.gridColumnApi = null;
        }
    }

    setSize(width, height) {
        if (width) {
            this.dom.style.width = width;
        }

        if (height) {
            this.dom.style.height = height;
        }

        if (this.gridApi && typeof this.gridApi.sizeColumnsToFit === "function") {
            this.gridApi.sizeColumnsToFit();
        }

        return this;
    }

    notifyLayout() {
        if (!this.gridApi) {
            return;
        }

        try {
            if (typeof this.gridApi.sizeColumnsToFit === "function") {
                this.gridApi.sizeColumnsToFit();
            }
        } catch {
            // ag-Grid API varies by version.
        }

        this.autoSizeColumns();
    }

    on(eventType, callback) {
        this.dom.addEventListener(eventType, (event) => callback(event.detail));
    }
}

export { SpreadsheetUIComponent };