import { Label, InputText, Span } from "../../primitives/ui.js";

/** @category Inputs */
class ThemeToggle extends Label {
    constructor(context, ops) {
        super();

        this.dom.id = "theme";

        this.setFor("theme");

        this.dom.className = "theme";

        const toggleWrap = new Span();

        toggleWrap.dom.className = "theme__toggle-wrap";

        this.toggle = new InputText();

        this.toggle.dom.id = "theme";

        this.toggle.dom.className = "theme__toggle";

        this.toggle.dom.type = "checkbox";

        this.toggle.dom.role = "switch";

        this.toggle.dom.name = "theme";

        this.toggle.dom.value = "dark";

        const icon = new Span();

        icon.dom.className = "theme__icon";

        for (let i = 0; i < 9; i++) {
            const iconPart = new Span();

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

export { ThemeToggle };

export default ThemeToggle;