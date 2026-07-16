import { ListboxItem, UIDiv, UIText } from "../primitives/ui.js";

function isUIElement(value) {
  return Boolean(value && typeof value === "object" && value.dom);
}

function isDomElement(value) {
  return Boolean(value && typeof value === "object" && value.addEventListener);
}

function formatPropertyValue(value) {
  if (value == null || value === "") {
    return "—";
  }

  return String(value);
}

function createPropertyCell(text, className) {
  const cell = new UIText(text);
  cell.addClass("Property");

  if (className) {
    cell.addClass(className);
  }

  return cell;
}

function createPropertyValueCell(value) {
  const cell = new UIDiv();
  cell.addClass("PropertyValue");

  if (isUIElement(value)) {
    cell.add(value);
  } else {
    cell.setTextContent(formatPropertyValue(value));
  }

  return cell;
}

function isPropertyRowSpec(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !isUIElement(value) &&
      !isDomElement(value) &&
      (
        Object.prototype.hasOwnProperty.call(value, "cells") ||
        Object.prototype.hasOwnProperty.call(value, "label") ||
        Object.prototype.hasOwnProperty.call(value, "value")
      ),
  );
}

/**
 * @typedef {Object} PropertyCellSpec
 * @property {*} content
 * @property {string|string[]} [className]
 * @property {Object<string, string>} [styles]
 * @property {string} [tooltip]
 * @property {function({ row: ListboxItem, spec: PropertyRowSpec, table: PropertyTable, value: *, cell: UIDiv, cellSpec: PropertyCellSpec, cellIndex: number }): void} [configure]
 * @property {function(Event, { row: ListboxItem, spec: PropertyRowSpec, table: PropertyTable, value: *, cell: UIDiv, cellSpec: PropertyCellSpec, cellIndex: number }): void} [onClick]
 * @property {function(Event, { row: ListboxItem, spec: PropertyRowSpec, table: PropertyTable, value: *, cell: UIDiv, cellSpec: PropertyCellSpec, cellIndex: number }): void} [onChange]
 * @property {function(Event, { row: ListboxItem, spec: PropertyRowSpec, table: PropertyTable, value: *, cell: UIDiv, cellSpec: PropertyCellSpec, cellIndex: number }): void} [onInput]
 * @property {function(Event, { row: ListboxItem, spec: PropertyRowSpec, table: PropertyTable, value: *, cell: UIDiv, cellSpec: PropertyCellSpec, cellIndex: number }): void} [onBlur]
 * @property {function(Event, { row: ListboxItem, spec: PropertyRowSpec, table: PropertyTable, value: *, cell: UIDiv, cellSpec: PropertyCellSpec, cellIndex: number }): void} [onEnter]
 */

/**
 * @typedef {Object} PropertyRowSpec
 * @property {*} [label]
 * @property {*} [value]
 * @property {string} [tooltip]
 * @property {string} [title]
 * @property {PropertyCellSpec[]} [cells]
 * @property {string|string[]} [className]
 * @property {string|string[]} [rowClass]
 * @property {string|string[]} [labelClass]
 * @property {string|string[]} [valueClass]
 * @property {Object<string, string>} [styles]
 * @property {Object<string, string>} [rowStyles]
 * @property {Object<string, string>} [labelStyles]
 * @property {Object<string, string>} [valueStyles]
 * @property {function({ row: ListboxItem, table: PropertyTable, value: *, spec: PropertyRowSpec }): void} [configure]
 * @property {function(Event, { row: ListboxItem, spec: PropertyRowSpec, table: PropertyTable, value: * }): void} [onClick]
 * @property {function(Event, { row: ListboxItem, spec: PropertyRowSpec, table: PropertyTable, value: *, cell: UIDiv, cellIndex: number }): void} [onChange]
 * @property {function(Event, { row: ListboxItem, spec: PropertyRowSpec, table: PropertyTable, value: *, cell: UIDiv, cellIndex: number }): void} [onInput]
 * @property {function(Event, { row: ListboxItem, spec: PropertyRowSpec, table: PropertyTable, value: *, cell: UIDiv, cellIndex: number }): void} [onBlur]
 * @property {function(Event, { row: ListboxItem, spec: PropertyRowSpec, table: PropertyTable, value: *, cell: UIDiv, cellIndex: number }): void} [onEnter]
 */

function createCellSpec(content, options = {}) {
  return {
    content,
    ...options,
  };
}

function withDefaultClass(className, defaultClassName) {
  if (!defaultClassName) return className || "";

  if (!className) return defaultClassName;

  return [defaultClassName, className];
}

function createDefaultRowSpec(label, value, tooltip = "") {
  const labelText = formatPropertyValue(label);
  const valueTooltip = !isUIElement(value) && !isDomElement(value)
    ? formatPropertyValue(value)
    : "";

  return {
    tooltip,
    cells: [
      createCellSpec(labelText, {
        className: "PropertyTable-label",
        tooltip: labelText,
      }),
      createCellSpec(value, {
        className: "PropertyTable-value",
        tooltip: valueTooltip,
      }),
    ],
  };
}

function resolvePropertyRowSpec(rowOrLabel, value, tooltip = "") {
  if (isPropertyRowSpec(rowOrLabel)) {
    const rowSpec = { ...rowOrLabel };

    if (Array.isArray(rowSpec.cells)) {
      return rowSpec;
    }

    return {
      ...rowSpec,
      ...createDefaultRowSpec(rowSpec.label, rowSpec.value, rowSpec.tooltip || rowSpec.title || tooltip),
    };
  }

  return createDefaultRowSpec(rowOrLabel, value, tooltip);
}

function createRowCell(cellSpec, index = 0) {
  if (!cellSpec || typeof cellSpec !== "object" || Array.isArray(cellSpec)) {
    throw new TypeError("PropertyTable cell specs must be objects, for example { content, className }.");
  }

  const spec = {
    ...cellSpec,
    className: withDefaultClass(cellSpec.className, index === 0 ? "PropertyTable-label" : ""),
  };
  const cell = new UIDiv();
  const content = spec.content;

  cell.addClass("PropertyTable-cell");
  applyClasses(cell, spec.className || spec.cellClass);
  applyStyles(cell, spec.styles || spec.cellStyles);

  if (isUIElement(content)) {
    cell.add(content);
  } else if (isDomElement(content)) {
    cell.dom.appendChild(content);
  } else {
    cell.setTextContent(formatPropertyValue(content));
  }

  const tooltip = spec.tooltip || spec.title;
  if (tooltip) {
    cell.dom.title = tooltip;
  } else if (!isUIElement(content) && !isDomElement(content)) {
    cell.dom.title = formatPropertyValue(content);
  }

  return { cell, spec, content };
}

/**
 * A property-table row (label/value or multi-cell).
 *
 * Shorthand usage keeps the legacy two-column contract:
 * new PropertyRow("Name", input, "Optional tooltip")
 *
 * Explicit row-spec usage enables multi-cell rows:
 * new PropertyRow({
 *   tooltip: "Coordinates",
 *   cells: [
 *     { content: "Position", className: "PropertyTable-label" },
 *     { content: xInput, className: "PropertyTable-value", onChange: handleX },
 *   ],
 * })
 */
class PropertyRow extends ListboxItem {
  /**
   * @param {PropertyRowSpec|*} rowOrLabel
   * @param {*} [value]
   * @param {string} [tooltip=""]
   */
  constructor(rowOrLabel, value, tooltip = "") {
    super();

    const rowSpec = resolvePropertyRowSpec(rowOrLabel, value, tooltip);
    const cellEntries = (rowSpec.cells || []).map((cellSpec, index) => createRowCell(cellSpec, index));
    const cellEls = cellEntries.map(({ cell }) => cell);
    const labelEl = cellEls.find((cell) => cell.dom.classList.contains("PropertyTable-label")) || cellEls[0] || null;
    const valueEl =
      cellEls.find((cell, index) => index > 0 && cell.dom.classList.contains("PropertyTable-value")) ||
      cellEls[1] ||
      null;

    if (rowSpec.tooltip || rowSpec.title) {
      this.dom.title = rowSpec.tooltip || rowSpec.title;
    }

    this.add(...cellEls);

    this.labelEl = labelEl;
    this.valueEl = valueEl;
    this.cellEls = cellEls;
    this.cellSpecs = cellEntries.map(({ spec }) => spec);
    this.cellContents = cellEntries.map(({ content }) => content);
  }

  /**
   * @param {*} nextValue
   * @returns {this}
   */
  setValue(nextValue) {
    if (!this.valueEl) return this;

    this.valueEl.clear();

    if (isUIElement(nextValue)) {
      this.valueEl.add(nextValue);
    } else if (isDomElement(nextValue)) {
      this.valueEl.dom.appendChild(nextValue);
    } else {
      this.valueEl.setTextContent(formatPropertyValue(nextValue));
      this.valueEl.dom.title = formatPropertyValue(nextValue);
    }

    return this;
  }

  /**
   * @param {*} nextLabel
   * @returns {this}
   */
  setLabel(nextLabel) {
    if (!this.labelEl) return this;

    const nextText = formatPropertyValue(nextLabel);
    this.labelEl.setTextContent(nextText);
    this.labelEl.dom.title = nextText;
    return this;
  }
}

function applyClasses(element, classes) {
  if (!element || !classes) return;

  const classList = Array.isArray(classes) ? classes : String(classes).split(/\s+/);

  classList.filter(Boolean).forEach((className) => {
    element.addClass(className);
  });
}

function applyStyles(element, styles) {
  if (!element || !styles) return;

  element.setStyles(styles);
}

function resolveEventTarget(value) {
  if (isUIElement(value)) return value.dom;

  if (isDomElement(value)) return value;

  return null;
}

function bindValueEvent(value, fallbackTarget, eventName, callback, context) {
  if (typeof callback !== "function") return;

  const target = resolveEventTarget(value) || resolveEventTarget(fallbackTarget);

  if (!target) return;

  target.addEventListener(eventName, (event) => {
    callback(event, context);
  });
}

function bindCallbacksForTarget(value, fallbackTarget, callbackSpec, context) {
  if (!callbackSpec) return;

  bindValueEvent(value, fallbackTarget, "change", callbackSpec.onChange || callbackSpec.callbacks?.change || callbackSpec.events?.change, context);
  bindValueEvent(value, fallbackTarget, "input", callbackSpec.onInput || callbackSpec.callbacks?.input || callbackSpec.events?.input, context);
  bindValueEvent(value, fallbackTarget, "blur", callbackSpec.onBlur || callbackSpec.callbacks?.blur || callbackSpec.events?.blur, context);

  const enterCallback = callbackSpec.onEnter || callbackSpec.callbacks?.enter || callbackSpec.events?.enter;
  if (typeof enterCallback === "function") {
    const target = resolveEventTarget(value) || resolveEventTarget(fallbackTarget);

    if (target) {
      target.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;

        event.preventDefault();
        enterCallback(event, context);
      });
    }
  }
}

function bindCellSpecCallbacks(row, rowSpec, table) {
  const cellEls = row["cellEls"] || [];
  const cellSpecs = row["cellSpecs"] || [];
  const cellContents = row["cellContents"] || [];

  cellEls.forEach((cell, index) => {
    const cellSpec = cellSpecs[index];
    const value = cellContents[index];
    const context = { row, spec: rowSpec, table, value, cell, cellSpec, cellIndex: index };

    bindCallbacksForTarget(value, cell, rowSpec, context);

    if (cellSpec && cellSpec !== rowSpec) {
      bindCallbacksForTarget(value, cell, cellSpec, context);

      const cellClick = cellSpec.onClick || cellSpec.callbacks?.click || cellSpec.events?.click;
      if (typeof cellClick === "function") {
        cell.dom.addEventListener("click", (event) => {
          cellClick(event, context);
        });
      }
    }

    if (typeof cellSpec?.configure === "function") {
      cellSpec.configure(context);
    }
  });
}

function bindRowSpecCallbacks(row, spec, table) {
  if (!spec) return;

  const callbacks = spec.callbacks || spec.events || {};
  const value = spec.value;

  const rowClick = spec.onClick || callbacks.click || callbacks.rowClick;
  if (typeof rowClick === "function") {
    row.dom.addEventListener("click", (event) => {
      rowClick(event, { row, spec, table, value });
    });
  }

  if (Array.isArray(spec.cells)) {
    bindCellSpecCallbacks(row, spec, table);
    return;
  }

  bindCallbacksForTarget(value, row["valueEl"], spec, { row, spec, table, value, cell: row["valueEl"], cellIndex: 1 });
}

class PropertyTable extends UIDiv {
  constructor(options = {}) {
    super();

    this.addClass("PropertyTable");
    this.addClass("Column");

    this.rowsByKey = {};
    this.valuesByKey = {};
    this.valueCellsByKey = {};
    this.cellsByKey = {};

    if (options.title) {
      this.titleEl = createPropertyCell(options.title, "PropertyTable-title");
      this.add(this.titleEl);
    }

    if (options.header) {
      this.header = new PropertyRow(options.header);
      this.header.addClass("PropertyTable-header");
      this.add(this.header);
    }

    this.body = new UIDiv();
    this.body.addClass("PropertyTable-body");
    this.body.addClass("Column");
    this.add(this.body);

    if (options.compact) {
      this.setStyle("gap", ["0"]);
      this.body.setStyle("gap", ["0"]);
    }

    if (options.rows) {
      this._addRows(options.rows);
    }
  }

  _createRow(label, value, tooltip = "") {
    const row = new PropertyRow(label, value, tooltip);
    this.body.add(row);
    return row;
  }

  _addRow(key, spec = {}) {
    if (!spec || typeof spec !== "object" || isUIElement(spec)) {
      throw new TypeError("PropertyTable rows must be keyed objects, for example { label, value }.");
    }

    const rowSpec = /** @type {any} */ (spec);

    const label = rowSpec.label !== undefined ? rowSpec.label : key;
    const value = Object.prototype.hasOwnProperty.call(rowSpec, "value") ? rowSpec.value : "";
    const tooltip = rowSpec.tooltip || rowSpec.title || "";
    const row = new PropertyRow({ label, value, tooltip, ...rowSpec });

    this.body.add(row);

    row["key"] = key;
    row["spec"] = rowSpec;
    this.rowsByKey[key] = row;
    this.valuesByKey[key] = isUIElement(value) ? value : row["valueEl"];
    this.valueCellsByKey[key] = row["valueEl"];
    this.cellsByKey[key] = row["cellEls"] || [];

    applyClasses(row, rowSpec.className || rowSpec.rowClass);
    applyClasses(row["labelEl"], rowSpec.labelClass);
    applyClasses(row["valueEl"], rowSpec.valueClass);
    applyStyles(row, rowSpec.styles || rowSpec.rowStyles);
    applyStyles(row["labelEl"], rowSpec.labelStyles);
    applyStyles(row["valueEl"], rowSpec.valueStyles);

    if (typeof rowSpec.configure === "function") {
      rowSpec.configure({ row, table: this, value, spec: rowSpec });
    }

    bindRowSpecCallbacks(row, rowSpec, this);

    return row;
  }

  _addRows(rows = {}) {
    if (!rows || typeof rows !== "object" || Array.isArray(rows) || isUIElement(rows)) {
      throw new TypeError("PropertyTable rows must be a keyed object of row specs.");
    }

    Object.entries(rows).forEach(([key, spec]) => {
      this._addRow(key, spec);
    });

    return this;
  }

  clearRows() {
    this.body.clear();
    this.rowsByKey = {};
    this.valuesByKey = {};
    this.valueCellsByKey = {};
    this.cellsByKey = {};
    return this;
  }

  setRows(rows = {}) {
    this.clearRows();
    this._addRows(rows);
    return this;
  }

  getRow(key) {
    return this.rowsByKey[key] || null;
  }

  getValue(key) {
    return this.valuesByKey[key] || null;
  }

  getValueCell(key) {
    return this.valueCellsByKey[key] || null;
  }

  getCells(key) {
    return this.cellsByKey[key] || [];
  }
}

export { PropertyTable, PropertyRow };