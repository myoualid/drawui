import { UIRow, UIText } from "../primitives/ui.js";

class LoadingBar extends UIRow {
    constructor(options = {}) {
        super();

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
        this.boundSignalHandlers = [];

        this.setClass("LoadingBar");
        this.dom.style.zIndex = String(this.options.zIndex);
        this.dom.style.transition = `opacity ${this.options.fadeTime}ms ease`;
        this.dom.style.display = "none";
        this.createDom();

        if (options.context) {
            this.bindContextSignals(options.context);
        }
    }

    bindContextSignals(context) {
        if (!context?.signals) {
            return this;
        }

        const bind = (signalName, handler) => {
            const signal = context.signals[signalName];

            if (!signal || typeof signal.add !== "function") {
                return;
            }

            signal.add(handler);
            this.boundSignalHandlers.push({ signal, handler });
        };

        bind("startLoading", (text) => {
            this.show();
            this.update(0, text || this.options.initialText);
        });

        bind("progressLoading", (progress, text) => {
            this.update(progress, text);
        });

        bind("endLoading", () => {
            this.update(1);
            this.hide();
        });

        bind("fakeProgress", (durationSeconds = 1) => {
            this.show();
            const startTime = Date.now();
            const intervalId = window.setInterval(() => {
                const elapsedSeconds = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsedSeconds / durationSeconds, 1);

                this.update(progress);

                if (progress >= 1) {
                    window.clearInterval(intervalId);
                    this.hide();
                }
            }, 100);
        });

        return this;
    }

    createDom() {
        this.progressElement = document.createElement("div");
        this.progressElement.className = "LoadingBar-fill";

        if (this.options.showText || this.options.showPercentage) {
            const textContainer = document.createElement("div");
            textContainer.className = "LoadingBar-meta";

            if (this.options.showText) {
                this.textElement = new UIText(this.options.initialText);
                this.textElement.setClass("LoadingBar-text");
                textContainer.appendChild(this.textElement.dom);
            }

            if (this.options.showPercentage) {
                this.percentageElement = document.createElement("div");
                this.percentageElement.className = "LoadingBar-percentage";
                this.percentageElement.textContent = "0%";
                textContainer.appendChild(this.percentageElement);
            }

            const wrap = document.createElement("div");
            wrap.className = "LoadingBar-inner";
            wrap.appendChild(textContainer);

            const track = document.createElement("div");
            track.className = "LoadingBar-track";
            track.appendChild(this.progressElement);
            wrap.appendChild(track);
            this.dom.appendChild(wrap);
            return;
        }

        this.addClass("LoadingBar--simple");
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
        this.boundSignalHandlers.forEach(({ signal, handler }) => {
            if (typeof signal.remove === "function") {
                signal.remove(handler);
            }
        });

        this.boundSignalHandlers = [];
        this.hide();
    }
}

export { LoadingBar };
