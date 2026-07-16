import {
  UIText,
  UICheckbox,
  UIIcon,
  ListboxItem,
  UIListbox,
} from "../primitives/ui.js";

/**
 * Drag-and-drop reorderable list with optional per-item checkboxes.
 */
class ReorderableList {
  /**
   * @param {Array<{label?: string, checked?: boolean, onChange?: Function}|string>} [items=[]]
   * @param {Function|null} [onReorder=null] - Called with the new items array after a drop
   */
  constructor(items = [], onReorder = null) {
    this.items = [...items];
    this.onReorder = onReorder;
    this.draggedItem = null;
    this.placeholder = null;
    this._fromIndex = -1;

    this.container = new UIListbox();
    this.container.addClass("reorderable-list");
    this.container.dom.setAttribute("role", "list");

    this.render();
    this.setupDragAndDrop();
  }

  render() {
    this.container.clear();
    this.container.listitems = [];

    this.items.forEach((item, index) => {
      const labelText = typeof item === "string" ? item : item.label || String(item);
      const listItem = new ListboxItem(this.container);

      listItem.addClass("reorderable-item");
      listItem.dom.draggable = true;
      listItem.dom.dataset.index = String(index);
      listItem.dom.setAttribute("role", "listitem");

      const handle = new UIIcon("drag_indicator");
      handle.addClass("drag-handle");
      handle.dom.setAttribute("aria-hidden", "true");
      listItem.add(handle);

      if (typeof item === "object" && item.checked !== undefined) {
        const checkbox = new UICheckbox(item.checked);
        checkbox.onChange(() => {
          item.checked = checkbox.getValue();
          if (item.onChange) item.onChange(item.checked);
        });
        // Keep checkbox interaction from starting a drag
        checkbox.dom.addEventListener("mousedown", (e) => e.stopPropagation());
        checkbox.dom.addEventListener("pointerdown", (e) => e.stopPropagation());
        listItem.add(checkbox);
      }

      const label = new UIText(labelText);
      label.addClass("reorderable-item-label");
      listItem.add(label);

      this.container.add(listItem);
    });
  }

  setupDragAndDrop() {
    const root = this.container.dom;

    root.addEventListener("dragstart", (e) => {
      const item = e.target.closest(".reorderable-item");
      if (!item || !root.contains(item)) return;

      // Ignore drag starts from interactive controls
      if (e.target.closest("input, button, label, .Checkbox")) {
        e.preventDefault();
        return;
      }

      this.draggedItem = item;
      this._fromIndex = parseInt(item.dataset.index, 10);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(this._fromIndex));

      const height = item.offsetHeight;

      this.placeholder = document.createElement("div");
      this.placeholder.className = "reorderable-placeholder";
      this.placeholder.setAttribute("aria-hidden", "true");
      this.placeholder.style.height = `${height}px`;

      // Placeholder takes the slot; hide the source row without canceling the drag
      item.parentNode.insertBefore(this.placeholder, item);
      item.classList.add("is-dragging");
    });

    root.addEventListener("dragend", () => {
      if (this.draggedItem) {
        this.draggedItem.classList.remove("is-dragging");
        this.draggedItem = null;
      }
      this._fromIndex = -1;
      this._removePlaceholder();
    });

    root.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (!this.placeholder) return;

      const target = e.target.closest(".reorderable-item");
      if (!target || target === this.draggedItem || !root.contains(target)) return;

      const rect = target.getBoundingClientRect();
      const before = e.clientY < rect.top + rect.height / 2;

      if (before) {
        target.parentNode.insertBefore(this.placeholder, target);
      } else {
        target.parentNode.insertBefore(this.placeholder, target.nextSibling);
      }
    });

    root.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!this.draggedItem || !this.placeholder) return;

      const fromIndex = this._fromIndex;
      const toIndex = this._placeholderIndex();

      this._removePlaceholder();
      this.draggedItem.classList.remove("is-dragging");
      this.draggedItem = null;
      this._fromIndex = -1;

      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

      const [moved] = this.items.splice(fromIndex, 1);
      this.items.splice(toIndex, 0, moved);
      this.render();

      if (this.onReorder) this.onReorder(this.getItems());
    });
  }

  /**
   * Index of the placeholder among non-dragging item slots.
   * @returns {number}
   */
  _placeholderIndex() {
    if (!this.placeholder) return -1;
    const slots = Array.from(this.container.dom.children).filter(
      (el) => el !== this.draggedItem && !el.classList.contains("is-dragging"),
    );
    return slots.indexOf(this.placeholder);
  }

  _removePlaceholder() {
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.removeChild(this.placeholder);
    }
    this.placeholder = null;
  }

  updateItems(newItems) {
    this.items = [...newItems];
    this.render();
  }

  getItems() {
    return [...this.items];
  }
}

export { ReorderableList };
