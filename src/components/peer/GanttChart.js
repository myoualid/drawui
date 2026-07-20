import {
    Rectangle,
    TextBlock,
    InputList,
    Button,
    InputDropdown,
    Container,
} from "../../primitives/ui.js";
import { FloatingDialog } from "../panels/ContentPanel.js";

let jsganttModulePromise;
let JSGantt = null;

/** @category Peers */
function loadJsgantt() {
    jsganttModulePromise ??= import("jsgantt-improved").then((module) => {
        JSGantt = module.default ?? module;
        return JSGantt;
    });

    return jsganttModulePromise;
}

/** @category Peers */
function getJsganttNamespace() {
    if (JSGantt && typeof JSGantt.GanttChart === "function") {
        return JSGantt;
    }

    if (typeof window !== "undefined" && window.JSGantt && typeof window.JSGantt.GanttChart === "function") {
        return window.JSGantt;
    }

    return null;
}

/** @category Peers */
function defaultDateFormatter(value) {
    if (!value) {
        return "N/A";
    }

    const parsedDate = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        return String(value);
    }

    return parsedDate.toLocaleString();
}

/** @category Peers */
function ensureJsganttReady() {
    return loadJsgantt();
}

/** @category Peers */
function installSequenceGanttLeftResizeShim(ganttRootDom) {
    if (!ganttRootDom || typeof ganttRootDom.closest !== "function") {
        return;
    }

    const host = ganttRootDom.closest(".sequence-task-view-host");

    if (!host) {
        return;
    }

    const chartContainer = ganttRootDom.querySelector(".gchartcontainer");
    const leftColumn = ganttRootDom.querySelector(".gmain.gmainleft");

    if (!chartContainer || !leftColumn) {
        return;
    }

    const existingShim = leftColumn.querySelector(".sequence-gantt-left-resize-shim");

    if (existingShim) {
        existingShim.remove();
    }

    const shimElement = new Container().addClass("sequence-gantt-left-resize-shim").dom;
    leftColumn.appendChild(shimElement);

    shimElement.addEventListener("mousedown", (downEvent) => {
        downEvent.preventDefault();

        const startPointerX = downEvent.clientX;
        const startLeftWidth = leftColumn.offsetWidth;
        const minimumListWidth = 220;

        const onMove = (moveEvent) => {
            const chartWidth = chartContainer.clientWidth;
            const maximumListWidth = Math.floor(chartWidth * 0.55);
            let nextWidth = startLeftWidth + (moveEvent.clientX - startPointerX);

            if (nextWidth < minimumListWidth) {
                nextWidth = minimumListWidth;
            }

            if (nextWidth > maximumListWidth) {
                nextWidth = maximumListWidth;
            }

            leftColumn.style.flex = "0 0 auto";
            leftColumn.style.width = `${nextWidth}px`;
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);

            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("resize"));
            }
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    });
}

/** @category Peers */
function removeDomNodeGraphWithTimelineIndicatorClass(linesParent) {
    if (!linesParent || typeof linesParent.querySelectorAll !== "function") {
        return;
    }

    const markerNodeList = linesParent.querySelectorAll(".gCurDate");

    for (let index = 0; index < markerNodeList.length; index++) {
        const markerNode = markerNodeList[index];

        if (markerNode.parentNode) {
            markerNode.parentNode.removeChild(markerNode);
        }
    }
}

/** @category Peers */
function normalizeConstructorArguments(contextOrOptions, maybeOptions) {
    if (maybeOptions !== undefined) {
        return {
            context: contextOrOptions || null,
            options: maybeOptions && typeof maybeOptions === "object" ? maybeOptions : {},
        };
    }

    const options = contextOrOptions && typeof contextOrOptions === "object" ? contextOrOptions : {};

    return {
        context: options.context || null,
        options,
    };
}

/** @category Peers */
class GanttChart {
    constructor(contextOrOptions, maybeOptions) {
        const { context, options } = normalizeConstructorArguments(contextOrOptions, maybeOptions);

        this.context = context;
        this.operators = options.operators || null;
        this.shouldRunSelectTaskOnRowClick = options.shouldRunSelectTaskOnRowClick;
        this.onTaskRowClick = options.onTaskRowClick;
        this.onChartRendered = options.onChartRendered || null;
        this.onDependencyAdded = options.onDependencyAdded || null;
        this.onDependencyRemoved = options.onDependencyRemoved || null;
        this.onDependencyModified = options.onDependencyModified || null;
        this.resolveCurrentWorkscheduleId = options.resolveCurrentWorkscheduleId || null;
        this.dateFormatter = options.dateFormatter || defaultDateFormatter;
        this.ganttChart = null;
        this.jsganttNamespace = null;
        this.timelineIndicatorOverride = undefined;
        this.originalGanttDrawDependencies = null;
        this.originalGanttDraw = null;
        this.ganttFullDrawInProgress = false;
        this.tasksData = null;
        this.dependencyDialog = null;
        this.boundContextMenu = this.handleContextMenu.bind(this);
    }

    dispatchSignal(signalName, payload, callback) {
        if (typeof callback === "function") {
            callback(payload, this);
        }

        const signal = this.context?.signals?.[signalName];

        if (signal && typeof signal.dispatch === "function") {
            signal.dispatch(payload);
        }
    }

    coerceDateValueForJsgantt(value) {
        if (value instanceof Date) {
            return value;
        }

        const parsedDate = new Date(value);

        if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate;
        }

        return null;
    }

    normalizeIndicatorDateForChartFormat(ganttChart, indicatorDate) {
        const normalizedDate = new Date(indicatorDate.getTime());
        const format = ganttChart.vFormat;

        if (format === "hour") {
            normalizedDate.setMinutes(0, 0, 0);
        } else {
            normalizedDate.setHours(0, 0, 0, 0);
        }

        return normalizedDate;
    }

    applyTimelineIndicatorAfterDependencies(jsganttNamespace, invocationDetails) {
        if (!this.ganttChart || this.timelineIndicatorOverride === undefined) {
            return;
        }

        const linesParent = this.ganttChart.getLines();

        if (!linesParent) {
            return;
        }

        if (this.timelineIndicatorOverride === null) {
            removeDomNodeGraphWithTimelineIndicatorClass(linesParent);
            return;
        }

        if (!(this.timelineIndicatorOverride instanceof Date) || Number.isNaN(this.timelineIndicatorOverride.getTime())) {
            return;
        }

        if (invocationDetails?.invokedFromDrawDependencies && this.ganttFullDrawInProgress) {
            return;
        }

        if (typeof this.ganttChart.chartRowDateToX !== "function") {
            return;
        }

        if (!jsganttNamespace || typeof jsganttNamespace.getMinDate !== "function" || typeof jsganttNamespace.getMaxDate !== "function") {
            return;
        }

        const taskList = this.ganttChart.getList();

        if (!taskList) {
            return;
        }

        const normalizedIndicatorDate = this.normalizeIndicatorDateForChartFormat(this.ganttChart, this.timelineIndicatorOverride);
        const configuredMinDate = this.ganttChart.getMinDate();
        const configuredMaxDate = this.ganttChart.getMaxDate();
        const coercedMinDate = configuredMinDate ? this.coerceDateValueForJsgantt(configuredMinDate) : null;
        const coercedMaxDate = configuredMaxDate ? this.coerceDateValueForJsgantt(configuredMaxDate) : null;
        const chartMinDate = jsganttNamespace.getMinDate(taskList, this.ganttChart.vFormat, coercedMinDate);
        const chartMaxDate = jsganttNamespace.getMaxDate(taskList, this.ganttChart.vFormat, coercedMaxDate);

        removeDomNodeGraphWithTimelineIndicatorClass(linesParent);

        if (chartMinDate.getTime() > normalizedIndicatorDate.getTime() || chartMaxDate.getTime() < normalizedIndicatorDate.getTime()) {
            return;
        }

        const pixelX = this.ganttChart.chartRowDateToX(normalizedIndicatorDate);
        const chartTable = this.ganttChart.getChartTable();

        if (!chartTable) {
            return;
        }

        this.ganttChart.sLine(pixelX, 0, pixelX, chartTable.offsetHeight - 1, "gCurDate");
    }

    installDrawDependenciesTimelineWrapper(jsganttNamespace) {
        if (!this.ganttChart || typeof this.ganttChart.DrawDependencies !== "function") {
            return;
        }

        this.originalGanttDrawDependencies = this.ganttChart.DrawDependencies.bind(this.ganttChart);

        this.ganttChart.DrawDependencies = (debugFlag) => {
            this.originalGanttDrawDependencies(debugFlag);
            this.applyTimelineIndicatorAfterDependencies(jsganttNamespace, {
                invokedFromDrawDependencies: true,
            });
        };
    }

    installDrawTimelineWrapper() {
        if (!this.ganttChart || typeof this.ganttChart.Draw !== "function") {
            return;
        }

        this.originalGanttDraw = this.ganttChart.Draw.bind(this.ganttChart);

        this.ganttChart.Draw = () => {
            this.ganttFullDrawInProgress = true;
            this.originalGanttDraw();
            this.ganttFullDrawInProgress = false;
        };
    }

    refreshTimelineIndicatorLine() {
        if (this.ganttChart && typeof this.ganttChart.DrawDependencies === "function") {
            this.ganttChart.DrawDependencies(false);
        }
    }

    setTimelineIndicatorDate(indicatorDate) {
        if (indicatorDate instanceof Date && !Number.isNaN(indicatorDate.getTime())) {
            this.timelineIndicatorOverride = indicatorDate;
            this.refreshTimelineIndicatorLine();
        }
    }

    hideTimelineIndicator() {
        this.timelineIndicatorOverride = null;
        this.refreshTimelineIndicatorLine();
    }

    clearTimelineIndicatorOverride() {
        this.timelineIndicatorOverride = undefined;
        this.refreshTimelineIndicatorLine();
    }

    render(taskData, container) {
        this.tasksData = taskData;
        container.clear();
        this.displayTasks(taskData, container.dom);
    }

    displayTasks(taskData, dom) {
        ensureJsganttReady()
            .then(() => {
                this.createGanttChart(dom, taskData);
            })
            .catch((error) => {
                if (typeof console !== "undefined" && typeof console.error === "function") {
                    console.error(error);
                }
            });
    }

    createGanttChart(dom, jsonData) {
        const jsganttNamespace = getJsganttNamespace();

        if (!jsganttNamespace) {
            return;
        }

        // jsGantt styles target div.gantt; without it, night theme text inherits
        // onto the library's hardcoded white cell backgrounds.
        if (dom && typeof dom.classList?.add === "function") {
            dom.classList.add("gantt");
        }

        this.ganttChart = new jsganttNamespace.GanttChart(dom, "week");
        this.ganttChart.setOptions({
            vCaptionType: "Caption",
            vQuarterColWidth: 36,
            vDateTaskDisplayFormat: "day dd month yyyy",
            vDayMajorDateDisplayFormat: "mon yyyy - Week ww",
            vWeekMinorDateDisplayFormat: "dd mon",
            vLang: "en",
            vShowTaskInfoLink: 1,
            vShowEndWeekDate: 0,
            vUseSingleCell: 10000,
            vFormatArr: ["Hour", "Day", "Week", "Month", "Quarter"],
            vShowRes: true,
            vShowComp: false,
            vShowDur: false,
            vAdditionalHeaders: {
                ifcduration: { title: "Duration" },
            },
            vUseToolTip: false,
        });

        this.ganttChart.vEvents.afterDraw = () => {
            if (!this.ganttChart?.vDiv) {
                return;
            }

            installSequenceGanttLeftResizeShim(this.ganttChart.vDiv);
            this.applyTimelineIndicatorAfterDependencies(jsganttNamespace);
        };

        const jsonString = typeof jsonData === "string" ? jsonData : JSON.stringify(jsonData);
        jsganttNamespace.parseJSONString(jsonString, this.ganttChart);

        this.jsganttNamespace = jsganttNamespace;
        this.installDrawTimelineWrapper();
        this.installDrawDependenciesTimelineWrapper(jsganttNamespace);

        this.ganttChart.vEventClickRow = (task) => {
            const taskId = task.getOriginalID();

            if (typeof this.onTaskRowClick === "function") {
                this.onTaskRowClick(taskId, task, this);
                return;
            }

            const shouldRun = typeof this.shouldRunSelectTaskOnRowClick === "function"
                ? this.shouldRunSelectTaskOnRowClick(taskId, task, this)
                : true;

            if (!shouldRun) {
                return;
            }

            if (this.operators && typeof this.operators.execute === "function") {
                this.operators.execute("bim.enable_editing_task", this.context, taskId);
            }
        };

        if (typeof this.ganttChart.Draw === "function") {
            this.ganttChart.Draw();
        }

        this.enableContextMenu();
        this.dispatchSignal("chartRendered", { taskCount: jsonData.length || 0 }, this.onChartRendered);
    }

    generateTooltip(task) {
        return `
            <dl>
                <dt>Name:</dt><dd>${task.getName()}</dd>
                <dt>Start:</dt><dd>${this.dateFormatter(task.getStart())}</dd>
                <dt>End:</dt><dd>${this.dateFormatter(task.getEnd())}</dd>
                <dt>Duration:</dt><dd>${task.getDuration() || "N/A"}</dd>
            </dl>
        `;
    }

    removeDependencyDialog() {
        if (this.dependencyDialog && typeof this.dependencyDialog.hide === "function") {
            this.dependencyDialog.hide();
        } else if (this.dependencyDialog?.dom?.parentNode) {
            this.dependencyDialog.dom.parentNode.removeChild(this.dependencyDialog.dom);
        }

        this.dependencyDialog = null;
    }

    showDependencyDialog(task) {
        if (!task) {
            return;
        }

        this.removeDependencyDialog();

        const workscheduleId = this.getCurrentWorkscheduleId();
        const taskData = {
            Name: task?.getName(),
            id: task?.getID(),
            Dependencies: task?.getDepend ? task.getDepend() : [],
            DepType: task?.getDepType ? task.getDepType() : [],
        };

        const content = new Rectangle().addClass("ws-dependency-dialog-content");
        content.add(new TextBlock(`Manage Dependencies for "${taskData.Name}"`).addClass("Title"));

        const currentSection = new Rectangle().addClass("ws-dependency-section");
        currentSection.add(new TextBlock("Current Dependencies").addClass("Title"));

        const dependencies = taskData.Dependencies || [];
        const depTypes = taskData.DepType || [];

        if (dependencies.length === 0) {
            const noDependencies = new TextBlock("No dependencies");
            noDependencies.dom.style.color = "#999";
            noDependencies.dom.style.fontStyle = "italic";
            currentSection.add(noDependencies);
        } else {
            const dependencyList = new InputList().addClass("ws-dependency-items");

            for (let index = 0; index < dependencies.length; index++) {
                const dependencyItem = new Rectangle();
                const predecessorTask = this.ganttChart.vTaskList.find((entry) => entry.getID() == dependencies[index]);
                const predecessorName = predecessorTask ? predecessorTask.getName() : `Task ${dependencies[index]}`;
                dependencyItem.add(
                    new TextBlock(`${predecessorName} (ID: ${dependencies[index]}) - ${this.getDependencyTypeLabel(depTypes[index])}`)
                );

                const removeButton = new Button("Remove");
                removeButton.dom.style.backgroundColor = "#dc3545";
                removeButton.dom.style.color = "white";
                removeButton.onClick(() => {
                    this.dispatchSignal(
                        "dependencyRemoved",
                        { workscheduleId, taskId: taskData.id, predecessorId: dependencies[index] },
                        this.onDependencyRemoved
                    );
                });

                dependencyItem.add(removeButton);
                dependencyList.add(dependencyItem);
            }

            currentSection.add(dependencyList);
        }

        content.add(currentSection);

        const addSection = new Rectangle();
        addSection.add(new TextBlock("Add New Dependency").addClass("Title"));

        const addForm = new Rectangle();
        const predecessorLabel = new TextBlock("Predecessor Task:");
        const predecessorSelect = new InputDropdown();
        const currentId = taskData.id;
        const predecessorOptions = { "": "-- Select Predecessor Task --" };

        this.ganttChart.vTaskList.forEach((entry) => {
            try {
                const id = entry.getID();

                if (id == currentId) {
                    return;
                }

                predecessorOptions[id] = `${entry.getName()} (ID: ${id})`;
            } catch {
                // Ignore malformed rows from the underlying gantt library.
            }
        });

        predecessorSelect.setOptions(predecessorOptions);

        const typeLabel = new TextBlock("Type:");
        const typeSelect = new InputDropdown();
        typeSelect.setOptions({
            FS: "Finish to Start (FS)",
            FF: "Finish to Finish (FF)",
            SS: "Start to Start (SS)",
            SF: "Start to Finish (SF)",
        });

        const addButton = new Button("Add Dependency");
        addForm.add(predecessorLabel, predecessorSelect, typeLabel, typeSelect, addButton);
        addSection.add(addForm);
        content.add(addSection);

        const panel = new FloatingDialog({ context: this.context });
        panel
            .header(`Manage Dependencies for "${taskData.Name}"`)
            .content(content)
            .show();

        addButton.onClick(() => {
            const predecessorId = predecessorSelect.getValue();
            const dependencyType = typeSelect.getValue();

            if (!predecessorId) {
                alert("Please select a predecessor task");
                return;
            }

            if (dependencies.includes(predecessorId)) {
                alert("This dependency already exists");
                return;
            }

            this.dispatchSignal(
                "dependencyAdded",
                { workscheduleId, taskId: taskData.id, predecessorId, type: dependencyType },
                this.onDependencyAdded
            );
        });

        this.dependencyDialog = panel;
    }

    getDependencyTypeLabel(type) {
        const labels = {
            FS: "Finish to Start",
            FF: "Finish to Finish",
            SS: "Start to Start",
            SF: "Start to Finish",
        };

        return labels[type] || type;
    }

    getTaskById(id) {
        return this.ganttChart?.vTaskList?.find((task) => String(task.getID()) == String(id)) || null;
    }

    addDependency(taskId, predecessorId, type = "FS") {
        const task = this.getTaskById(taskId);

        if (!task) {
            return false;
        }

        try {
            if (typeof task.getDepend === "function" && typeof task.setDepend === "function") {
                const dependencies = task.getDepend() || [];
                const dependencyTypes = task.getDepType ? task.getDepType() || [] : [];

                if (dependencies.map(String).includes(String(predecessorId))) {
                    return false;
                }

                dependencies.push(predecessorId);
                dependencyTypes.push(type);
                task.setDepend(dependencies);

                if (typeof task.setDepType === "function") {
                    task.setDepType(dependencyTypes);
                }
            } else {
                const data = task.getDataObject ? task.getDataObject() : task.vData || {};
                const current = data.pDepend ? String(data.pDepend).split(",").filter(Boolean) : [];
                const token = `${predecessorId}${type}`;

                if (current.some((entry) => entry.startsWith(String(predecessorId)))) {
                    return false;
                }

                current.push(token);
                data.pDepend = current.join(",");
            }
        } catch {
            return false;
        }

        if (typeof this.ganttChart?.Draw === "function") {
            this.ganttChart.Draw();
        }

        this.dispatchSignal("dependencyModified", { taskId, predecessorId, type, action: "add" }, this.onDependencyModified);
        return true;
    }

    removeDependency(taskId, predecessorId) {
        const task = this.getTaskById(taskId);

        if (!task) {
            return false;
        }

        try {
            if (typeof task.getDepend === "function" && typeof task.setDepend === "function") {
                const dependencies = task.getDepend() || [];
                const dependencyTypes = task.getDepType ? task.getDepType() || [] : [];
                const index = dependencies.findIndex((entry) => String(entry) == String(predecessorId));

                if (index === -1) {
                    return false;
                }

                dependencies.splice(index, 1);

                if (dependencyTypes.length > index) {
                    dependencyTypes.splice(index, 1);
                }

                task.setDepend(dependencies);

                if (typeof task.setDepType === "function") {
                    task.setDepType(dependencyTypes);
                }
            } else {
                const data = task.getDataObject ? task.getDataObject() : task.vData || {};

                if (!data.pDepend) {
                    return false;
                }

                data.pDepend = String(data.pDepend)
                    .split(",")
                    .filter(Boolean)
                    .filter((entry) => !entry.startsWith(String(predecessorId)))
                    .join(",");
            }
        } catch {
            return false;
        }

        if (typeof this.ganttChart?.Draw === "function") {
            this.ganttChart.Draw();
        }

        this.dispatchSignal("dependencyModified", { taskId, predecessorId, action: "remove" }, this.onDependencyModified);
        return true;
    }

    setDependencyType(taskId, predecessorId, newType) {
        const task = this.getTaskById(taskId);

        if (!task) {
            return false;
        }

        try {
            if (typeof task.getDepend === "function" && typeof task.setDepType === "function") {
                const dependencies = task.getDepend() || [];
                const dependencyTypes = task.getDepType() || [];
                const index = dependencies.findIndex((entry) => String(entry) == String(predecessorId));

                if (index === -1) {
                    return false;
                }

                dependencyTypes[index] = newType;
                task.setDepType(dependencyTypes);
            } else {
                const data = task.getDataObject ? task.getDataObject() : task.vData || {};

                if (!data.pDepend) {
                    return false;
                }

                const pieces = String(data.pDepend).split(",").filter(Boolean);
                const targetPrefix = String(predecessorId);
                const targetIndex = pieces.findIndex((entry) => entry.startsWith(targetPrefix));

                if (targetIndex === -1) {
                    return false;
                }

                pieces[targetIndex] = `${predecessorId}${newType}`;
                data.pDepend = pieces.join(",");
            }
        } catch {
            return false;
        }

        if (typeof this.ganttChart?.Draw === "function") {
            this.ganttChart.Draw();
        }

        this.dispatchSignal("dependencyModified", { taskId, predecessorId, type: newType, action: "update" }, this.onDependencyModified);
        return true;
    }

    updateDependencies(taskId, dependencies) {
        const task = this.getTaskById(taskId);

        if (!task) {
            return false;
        }

        try {
            const tokens = dependencies.map((dependency) => {
                if (typeof dependency === "string") {
                    return dependency;
                }

                if (dependency && dependency.id && dependency.type) {
                    return `${dependency.id}${dependency.type}`;
                }

                return String(dependency);
            });

            if (typeof task.setDepend === "function") {
                task.setDepend(tokens.map((token) => token.replace(/[^0-9]/g, "")));

                if (typeof task.setDepType === "function") {
                    task.setDepType(tokens.map((token) => token.replace(/^[0-9]+/, "") || "FS"));
                }
            } else {
                const data = task.getDataObject ? task.getDataObject() : task.vData || {};
                data.pDepend = tokens.join(",");
            }
        } catch {
            return false;
        }

        if (typeof this.ganttChart?.Draw === "function") {
            this.ganttChart.Draw();
        }

        return true;
    }

    getDependenciesAsString(taskId) {
        const task = this.getTaskById(taskId);

        if (!task) {
            return "";
        }

        try {
            if (typeof task.getDepend === "function") {
                const dependencies = task.getDepend() || [];
                const dependencyTypes = task.getDepType ? task.getDepType() || [] : [];
                return dependencies.map((dependency, index) => `${dependency}${dependencyTypes[index] || "FS"}`).join(",");
            }

            const data = task.getDataObject ? task.getDataObject() : task.vData || {};
            return data.pDepend || "";
        } catch {
            return "";
        }
    }

    getCurrentWorkscheduleId() {
        if (typeof this.resolveCurrentWorkscheduleId === "function") {
            return this.resolveCurrentWorkscheduleId(this) || "default";
        }

        if (typeof window !== "undefined" && window.currentWorkscheduleId) {
            return window.currentWorkscheduleId;
        }

        return "default";
    }

    enableContextMenu() {
        if (this.ganttChart?.vDiv) {
            this.ganttChart.vDiv.removeEventListener("contextmenu", this.boundContextMenu);
            this.ganttChart.vDiv.addEventListener("contextmenu", this.boundContextMenu);
        }
    }

    handleContextMenu(event) {
        event.preventDefault();
        this.showDependencyDialog(this.getTaskFromEvent(event));
    }

    getTaskFromEvent(event) {
        const row = event.target.closest('[id^="childrow_"]');

        if (!row) {
            return null;
        }

        return this.getTaskById(row.id.replace("childrow_", ""));
    }

    dispose() {
        this.removeDependencyDialog();

        if (this.ganttChart?.vDiv) {
            this.ganttChart.vDiv.removeEventListener("contextmenu", this.boundContextMenu);
        }

        const chartDiv = typeof document !== "undefined" ? document.getElementById("GanttChartDIV") : null;

        if (chartDiv) {
            chartDiv.innerHTML = "";
        }

        this.ganttChart = null;
        this.tasksData = null;
        this.jsganttNamespace = null;
    }
}

export { GanttChart };
