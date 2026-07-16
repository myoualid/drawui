import { UIElement, UIInput, UISpan } from "../primitives/ui.js";

class DayNightCheckBox extends UIElement {
    constructor(context, ops) {
        super(document.createElement("label"));

        this.dom.id = "theme";

        this.dom.for = "theme";

        this.dom.className = "theme";

        const toggleWrap = new UISpan();

        toggleWrap.dom.className = "theme__toggle-wrap";

        this.toggle = new UIInput();

        this.toggle.dom.id = "theme";

        this.toggle.dom.className = "theme__toggle";

        this.toggle.dom.type = "checkbox";

        this.toggle.dom.role = "switch";

        this.toggle.dom.name = "theme";

        this.toggle.dom.value = "dark";

        const icon = new UISpan();

        icon.dom.className = "theme__icon";

        for (let i = 0; i < 9; i++) {
            const iconPart = new UISpan();

            iconPart.dom.className = "theme__icon-part";

            icon.add(iconPart);
        }

        this.add(toggleWrap);

        toggleWrap.add(this.toggle);

        toggleWrap.add(icon);

        this.dom.addEventListener("change", () => {
            const theme = this.getValue() ? "night" : "day";

            ops.execute("theme.change_to", context, theme);
        });

        this.listen(context);

        const resolved = context.config?.ui?.theme?.current ?? context.config?.ui?.theme?.default ?? "night";

        resolved === "day" ? this.dayTheme() : this.nightTheme();
    }

    listen(context) {
        context.signals.themeChanged.add((theme) => {
            theme === "day" ? this.dayTheme() : this.nightTheme();
        });
    }

    getValue() {
        return this.toggle.dom.checked;
    }

    setValue(value) {
        this.toggle.dom.checked = value;
    }

    dayTheme() {
        this.setValue(false);
    }

    nightTheme() {
        this.setValue(true);
    }
}

export { DayNightCheckBox };

export default DayNightCheckBox;