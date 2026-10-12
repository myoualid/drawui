import { StackPanel, Text, Container } from "../../primitives/ui.js";

/** @category Feedback */
class StatusBar extends StackPanel {
    constructor(options = {}) {
        super({ isVertical: false });

        this.options = {
            showPercentage: true,
            showText: true,
            zIndex: 1000,
            fadeTime: 300,
            initialText: "Loading...",
            ...options,
        };

        this.progressElement = null;
        this.textElement = null;
        this.percentageElement = null;
        this.progress = 0;
        this.visible = false;
        this.parentContainer = null;

        this.setClass("StatusBar");
        this.dom.style.zIndex = String(this.options.zIndex);
        this.dom.style.transition = `opacity ${this.options.fadeTime}ms ease`;
        this.dom.style.display = "none";
        this.createDom();
    }

    createDom() {
        this.progressElement = new Container().addClass("StatusBar-fill").dom;

        if (this.options.showText || this.options.showPercentage) {
            const textContainer = new Container().addClass("StatusBar-meta");

            if (this.options.showText) {
                this.textElement = new Text(this.options.initialText);
                this.textElement.setClass("StatusBar-text");
                textContainer.add(this.textElement);
            }

            if (this.options.showPercentage) {
                this.percentageElement = new Text("0%").addClass("StatusBar-percentage").dom;
                textContainer.dom.appendChild(this.percentageElement);
            }

            const wrap = new Container().addClass("StatusBar-inner");
            wrap.add(textContainer);

            const track = new Container().addClass("StatusBar-track");
            track.dom.appendChild(this.progressElement);
            wrap.add(track);
            this.dom.appendChild(wrap.dom);
            return;
        }

        this.addClass("StatusBar--simple");
        this.dom.appendChild(this.progressElement);
    }

    update(progress, text = null) {
        if (!this.visible) {
            this.show();
        }

        this.progress = Math.max(0, Math.min(1, progress));
        const percentage = Math.round(this.progress * 100);

        this.progressElement.style.width = `${percentage}%`;

        if (this.percentageElement) {
            this.percentageElement.textContent = `${percentage}%`;
        }

        if (text && this.textElement) {
            this.textElement.setValue(text);
        }
    }

    show() {
        if (this.visible) {
            return this;
        }

        if (this.parentContainer && !this.dom.parentNode) {
            this.parentContainer.appendChild(this.dom);
        }

        this.dom.style.display = "block";
        this.dom.offsetHeight;
        this.dom.style.opacity = "1";
        this.visible = true;
        this.parentContainer = this.dom.parentNode;

        return this;
    }

    hide() {
        if (!this.visible) {
            return this;
        }

        this.dom.style.opacity = "0";
        this.visible = false;

        if (this.parentContainer && this.dom.parentNode === this.parentContainer) {
            this.parentContainer.removeChild(this.dom);
        }

        return this;
    }

    destroy() {
        this.hide();
    }
}

export { StatusBar };
