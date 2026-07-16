import Chart from "chart.js/auto";

import { UIPanel } from "../primitives/ui.js";

class ChartUIComponent extends UIPanel {
    constructor(options = {}) {
        super();

        this.chartConfiguration = options.chartConfiguration;

        this.chartInstance = null;

        this.chartCanvas = document.createElement("canvas");

        this.chartCanvas.style.display = "block";

        this.chartCanvas.style.width = "100%";

        this.chartCanvas.style.height = "100%";

        this.setClass("chart-ui-component");

        this.dom.style.width = options.width || "100%";

        this.dom.style.height = options.height || "240px";

        if (options.minHeight) {
            this.dom.style.minHeight = options.minHeight;
        }

        this.dom.style.boxSizing = "border-box";

        this.dom.style.position = "relative";

        this.dom.appendChild(this.chartCanvas);
    }

    init() {
        this.initializeChart();
    }

    initializeChart() {
        if (this.chartInstance || !this.chartConfiguration) {
            return;
        }

        this.chartInstance = new Chart(this.chartCanvas, this.chartConfiguration);
    }

    setChartConfiguration(nextConfiguration) {
        this.chartConfiguration = nextConfiguration;

        if (!this.chartInstance) {
            this.initializeChart();

            return;
        }

        if (!nextConfiguration) {
            return;
        }

        const nextData = nextConfiguration.data;

        const nextOptions = nextConfiguration.options;

        const nextType = nextConfiguration.type;

        if (nextType && this.chartInstance.config && this.chartInstance.config.type !== nextType) {
            this.chartInstance.destroy();

            this.chartInstance = null;

            this.initializeChart();

            return;
        }

        if (nextData) {
            this.chartInstance.data = nextData;
        }

        if (nextOptions) {
            this.chartInstance.options = nextOptions;
        }

        this.chartInstance.update();
    }

    updateDatasets(datasets) {
        if (!this.chartInstance || !this.chartInstance.data) {
            return;
        }

        this.chartInstance.data.datasets = datasets;

        this.chartInstance.update();
    }

    destroy() {
        if (this.chartInstance && typeof this.chartInstance.destroy === "function") {
            this.chartInstance.destroy();

            this.chartInstance = null;
        }
    }

    notifyLayout() {
        if (!this.chartInstance || typeof this.chartInstance.resize !== "function") {
            return;
        }

        this.chartInstance.resize();
    }
}

export { ChartUIComponent };