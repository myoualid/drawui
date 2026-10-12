import {
  Text,
  Checkbox,
  Icon,
  InputListItem,
  InputList,
} from "../../primitives/ui.js";

/**
 * Drag-and-drop reorderable list with optional per-item checkboxes.
 * @category Collections
 */
class SortableList {
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

    this.container = new InputList();
    this.container.addClass("SortableList");
    this.container.dom.setAttribute("role", "list");

    this._pointerId = null;
    this._dragActive = false;
    this._startY = 0;
    this._ghost = null;
    this._ghostOffsetY = 0;

    this.render();
    this.setupDragAndDrop();
  }

  render() {
    if (this._pointerId != null || this.draggedItem || this._ghost) {
      this._clearDragVisuals();
    }

    this.container.clear();
    this.container.listitems = [];

    this.items.forEach((item, index) => {
      const labelText = typeof item === "string" ? item : item.label || String(item);
      const listItem = new InputListItem(this.container);

      listItem.addClass("SortableList-item");
      listItem.dom.dataset.index = String(index);
      listItem.dom.setAttribute("role", "listitem");

      const handle = new Icon("drag_indicator");
      handle.addClass("SortableList-handle");
      handle.dom.setAttribute("aria-hidden", "true");
      listItem.add(handle);

      if (typeof item === "object" && item.checked !== undefined) {
        const checkbox = new Checkbox(item.checked);
        checkbox.onChange(() => {
          item.checked = checkbox.getValue();
          if (item.onChange) item.onChange(item.checked);
        });
        // Keep checkbox interaction from starting a drag
        checkbox.dom.addEventListener("mousedown", (e) => e.stopPropagation());
        checkbox.dom.addEventListener("pointerdown", (e) => e.stopPropagation());
        listItem.add(checkbox);
      }

      const label = new Text(labelText);
      label.addClass("SortableList-label");
      listItem.add(label);

      this.container.add(listItem);
    });
  }

  setupDragAndDrop() {
    const root = this.container.dom;

    // Native HTML5 drag never starts here: the list sets user-select:none, and
    // collapsing the source row inside dragstart cancels the gesture.
    this._onPointerMove = (event) => {
      if (event.pointerId !== this._pointerId || !this.draggedItem) return;

      if (!this._dragActive) {
        if (Math.abs(event.clientY - this._startY) < 4) return;
        this._dragActive = true;
        this._beginDrag(this.draggedItem, event.clientY);
      }

      event.preventDefault();
      this._movePlaceholder(event.clientY);
    };

    this._onPointerUp = (event) => {
      if (event.pointerId !== this._pointerId) return;
      this._finishDrag(true);
    };

    this._onPointerCancel = (event) => {
      if (event.pointerId !== this._pointerId) return;
      this._finishDrag(false);
    };

    root.addEventListener("pointerdown", (event) => {
      if (this._pointerId != null) return;
      if (!event.isPrimary || event.button !== 0) return;

      const item = event.target.closest?.(".SortableList-item");
      if (!item || !root.contains(item) || item.classList.contains("is-dragging")) return;
      if (event.target.closest("input, button, textarea, select, a, label, .Checkbox")) return;

      event.stopPropagation();

      this._pointerId = event.pointerId;
      this._startY = event.clientY;
      this._dragActive = false;
      this.draggedItem = item;
      this._fromIndex = Number.parseInt(item.dataset.index, 10);

      try {
        root.setPointerCapture(event.pointerId);
      } catch {
        /* pointer already released */
      }

      window.addEventListener("pointermove", this._onPointerMove, { passive: false });
      window.addEventListener("pointerup", this._onPointerUp);
      window.addEventListener("pointercancel", this._onPointerCancel);
    });
  }

  /**
   * @param {HTMLElement} item
   * @param {number} clientY
   */
  _beginDrag(item, clientY) {
    const rect = item.getBoundingClientRect();

    const ghost = item.cloneNode(true);
    ghost.classList.add("SortableList-ghost");
    ghost.removeAttribute("id");
    ghost.setAttribute("aria-hidden", "true");
    ghost.style.position = "fixed";
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.margin = "0";
    ghost.style.boxSizing = "border-box";
    ghost.style.pointerEvents = "none";
    document.body.appendChild(ghost);

    const placeholder = document.createElement("div");
    placeholder.className = "SortableList-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.style.height = `${rect.height}px`;
    item.parentNode.insertBefore(placeholder, item);
    item.classList.add("is-dragging");

    this._ghost = ghost;
    this._ghostOffsetY = clientY - rect.top;
    this.placeholder = placeholder;
    document.documentElement.classList.add("SortableList-sorting");
  }

  /**
   * @param {number} clientY
   */
  _movePlaceholder(clientY) {
    if (this._ghost) {
      this._ghost.style.top = `${clientY - this._ghostOffsetY}px`;
    }
    if (!this.placeholder) return;

    const parent = this.container.dom;
    const rows = parent.querySelectorAll(".SortableList-item:not(.is-dragging)");
    let before = null;
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        before = row;
        break;
      }
    }

    if (before) {
      if (this.placeholder.nextElementSibling !== before) {
        parent.insertBefore(this.placeholder, before);
      }
    } else if (parent.lastElementChild !== this.placeholder) {
      parent.appendChild(this.placeholder);
    }
  }

  /**
   * @param {boolean} commit
   */
  _finishDrag(commit) {
    if (this._pointerId == null && !this.draggedItem) return;

    const fromIndex = this._fromIndex;
    const toIndex = commit && this._dragActive ? this._placeholderIndex() : -1;
    const didDrag = this._dragActive;

    this._clearDragVisuals();
    if (didDrag) this._suppressNextClick();

    if (!commit || !Number.isInteger(fromIndex) || fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return;
    }

    const [moved] = this.items.splice(fromIndex, 1);
    this.items.splice(toIndex, 0, moved);
    this.render();

    if (this.onReorder) this.onReorder(this.getItems());
  }

  _clearDragVisuals() {
    if (this._onPointerMove) {
      window.removeEventListener("pointermove", this._onPointerMove);
      window.removeEventListener("pointerup", this._onPointerUp);
      window.removeEventListener("pointercancel", this._onPointerCancel);
    }

    const root = this.container?.dom;
    if (root && this._pointerId != null && root.hasPointerCapture?.(this._pointerId)) {
      try {
        root.releasePointerCapture(this._pointerId);
      } catch {
        /* capture already released */
      }
    }

    if (this.draggedItem) {
      this.draggedItem.classList.remove("is-dragging");
    }

    this._removePlaceholder();

    if (this._ghost?.parentNode) {
      this._ghost.parentNode.removeChild(this._ghost);
    }
    this._ghost = null;
    document.documentElement.classList.remove("SortableList-sorting");

    this.draggedItem = null;
    this._fromIndex = -1;
    this._pointerId = null;
    this._dragActive = false;
  }

  _suppressNextClick() {
    const root = this.container.dom;
    const stop = (event) => {
      event.preventDefault();
      event.stopPropagation();
      root.removeEventListener("click", stop, true);
    };
    root.addEventListener("click", stop, true);
    // A drag may not be followed by a click. Don't let this swallow a later one.
    window.setTimeout(() => root.removeEventListener("click", stop, true), 50);
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

export { SortableList };
