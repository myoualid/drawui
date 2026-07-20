import { Span, Kbd, StackPanel } from "../../primitives/ui.js";

import { ContentPanel } from "./ContentPanel.js";

/**
 * One keyboard shortcut row: key chip + description.
 * @category Panels
 */
export class InstructionLine extends StackPanel {
  /**
   * @param {string} keyText
   * @param {string} description
   */
  constructor(keyText, description) {
    super({ isVertical: false });
    this.setStyle("alignItems", ["center"]);
    this.setStyle("display", ["flex"]);
    this.gap("8px");

    const desc = new Span();
    desc.setTextContent(description);

    this.add(new Kbd(keyText));
    this.add(desc);
  }
}

/**
 * Titled panel of keyboard / pointer instruction rows.
 * Uses the same {@link ContentPanel} chrome as CollapsiblePanel / WorkspacePanel.
 * @category Panels
 */
export class InstructionPanel extends ContentPanel {
  /**
   * @param {string} title
   * @param {string} iconName
   * @param {Array} [instructions=[]]
   */
  constructor(title, iconName, instructions = []) {
    super({
      title,
      icon: iconName,
      showFooter: false,
      resizable: false,
      resizeHandles: [],
      panelStyles: {
        height: "fit-content",
        maxHeight: "none",
        maxWidth: "none",
      },
    });

    this.addClass("InstructionPanel");

    for (const row of instructions) {
      const key = Array.isArray(row) ? row[0] : row.key;
      const desc = Array.isArray(row) ? row[1] : row.desc;
      this.add(new InstructionLine(key, desc));
    }
  }
}
