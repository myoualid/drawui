import { UIInput } from "../primitives/ui.js";
import { styleCompactField } from "./FieldControls.js";

class SearchInput extends UIInput {
  constructor(placeholder = "Search...", onInput = null) {
    super();

    this.dom.type = "search";
    this.dom.setAttribute("placeholder", placeholder);
    this.dom.setAttribute("aria-label", placeholder);

    styleCompactField(this, {
      width: "100%",
    });

    if (onInput) {
      this.dom.addEventListener("input", () => {
        onInput(this.getValue());
      });
    }
  }
}

export { SearchInput };