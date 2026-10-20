import { Text, Container } from "../../primitives/ui.js";

/**
 * Single-row status strip for the workspace footer. Message, progress, and
 * percentage sit side by side so the bar fits the 24px footer row.
 *
 * @category Feedback
 */
class StatusBar extends Container {
    constructor(options = {}) {
        super();

        this.options = {
            showPercentage: true,
            showText: true,
            initialText: "Loading...",
            ...options,
        };

        this.progress = 0;
        this.visible = false;
        this.parentContainer = null;
        this.textElement = null;
        this.percentageElement = null;

        this.setClass("StatusBar");
        this.dom.hidden = true;

        if (this.options.showText) {
            this.textElement = new Text(this.options.initialText);
            this.textElement.setClass("StatusBar-text");
            this.add(this.textElement);
        }

        const fill = new Container().addClass("StatusBar-fill");
        this.progressElement = fill.dom;
        this.add(new Container().addClass("StatusBar-track").add(fill));

        if (this.options.showPercentage) {
            const percentage = new Text("0%");
            percentage.setClass("StatusBar-percentage");
            this.percentageElement = percentage.dom;
            this.add(percentage);
        }

        if (!this.options.showText && !this.options.showPercentage) {
            this.addClass("StatusBar--simple");
        }
    }

    update(progress, text = null) {
        this.show();

        this.progress = Math.max(0, Math.min(1, progress));
        const percentage = Math.round(this.progress * 100);
        this.progressElement.style.width = `${percentage}%`;

        if (this.percentageElement) {
            this.percentageElement.textContent = `${percentage}%`;
        }

        if (text != null && this.textElement) {
            this.textElement.setValue(text);
        }

        return this;
    }

    show() {
        if (this.parentContainer && !this.dom.parentNode) {
            this.parentContainer.appendChild(this.dom);
        }

        this.dom.hidden = false;
        this.visible = true;
        return this;
    }

    hide() {
        this.progress = 0;
        this.progressElement.style.width = "0%";
        if (this.percentageElement) {
            this.percentageElement.textContent = "0%";
        }
        this.dom.hidden = true;
        this.visible = false;
        return this;
    }

    destroy() {
        this.hide();
        this.dom.remove();
        return this;
    }
}

export { StatusBar };
