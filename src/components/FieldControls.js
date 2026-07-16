import { UIButton } from "../primitives/ui.js";

const compactFieldBaseStyles = {
  background: "var(--dui-surface-control-bg)",
  borderRadius: "var(--dui-radius)",
  boxSizing: "border-box",
  color: "inherit",
  flex: "1 1 0%",
  fontSize: "var(--dui-font-size-sm)",
  minHeight: "var(--dui-control-height)",
  minWidth: "0",
  padding: "4px 8px",
};

function styleCompactField(control, extraStyles = {}) {
  control.addClass("CompactField");
  control.setStyles({
    ...compactFieldBaseStyles,
    ...extraStyles,
  });

  return control;
}

class CompactButton extends UIButton {
  constructor(text = "", extraStyles = {}) {
    super(text);

    this.setStyles({
      fontSize: "11px",
      padding: "4px 8px",
      ...extraStyles,
    });
  }
}

export { CompactButton, styleCompactField };