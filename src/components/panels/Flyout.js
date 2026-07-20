import {
  Container,
  Icon,
  Span,
  Rectangle,
} from "../../primitives/ui.js";

import { InputSearch } from "../../primitives/ui.js";

import { makeResizable } from "../../overlays/drag.js";

/**
 * Expandable tool panel with optional search row.
 * @category Overlays
 */
class Flyout extends Rectangle {
  constructor(options = {}) {
    super();

    this.options = {
      icon: options.icon || 'info',
      title: options.title || 'Panel',
      position: options.position || { top: '1rem', right: 'var(--dui-sidebar-width)' },
      badgeCount: options.badgeCount || null,
      hasSearch: options.hasSearch || false,
      onSearch: options.onSearch || null,
      ...options
    };

    makeResizable(this.dom, ['w', 'n']);

    this.isExpanded = false;

    this.contentContainer = null;

    this.toggleButton = null;

    this.header = null;

    this.searchInput = null;

    this.buildUI();
  }

  buildUI() {
    this.setClass('Flyout');

    this.setStyle('position', ['absolute']);

    // Apply position
    if (this.options.position.top) {
      this.setStyle('top', [this.options.position.top]);
    }

    if (this.options.position.bottom) {
      this.setStyle('bottom', [this.options.position.bottom]);
    }

    if (this.options.position.left) {
      this.setStyle('left', [this.options.position.left]);
    }

    if (this.options.position.right) {
      this.setStyle('right', [this.options.position.right]);
    }

    // Header (always visible)
    this.header = new Container();

    this.header.addClass('Flyout-header');

    this.header.addClass('centered');

    // Icon
    const icon = new Icon(this.options.icon);

    icon.addClass('Flyout-icon');

    this.header.add(icon);

    // Title
    const title = new Span(this.options.title);

    title.addClass('Flyout-title');

    this.header.add(title);

    this.add(this.header);

    // Content container (hidden by default)
    this.contentContainer = new Container();

    this.contentContainer.addClass('Flyout-content');

    this.contentContainer.setStyle('display', ['none']);

    this.contentContainer.setStyle('max-height', ['40vh']);

    this.contentContainer.setStyle('overflow', ['auto']);

    // Add search bar if enabled
    if (this.options.hasSearch) {
      const searchContainer = new Container();

      searchContainer.setStyle('padding', ['0.5rem']);

      searchContainer.setStyle('border-bottom', ['1px solid var(--dui-color-border)']);

      this.searchInput = new InputSearch('Search...', (value) => {
        if (this.options.onSearch) {
          this.options.onSearch(value);
        }
      });

      searchContainer.add(this.searchInput);

      this.contentContainer.add(searchContainer);
    }

    this.add(this.contentContainer);
  }

  /**
   * Toggle the expanded/collapsed state
   */
  toggle() {
    this.isExpanded = !this.isExpanded;

    this.updateVisibility();
  }

  /**
   * Expand the panel
   */
  expand() {
    this.isExpanded = true;

    this.updateVisibility();
  }

  /**
   * Collapse the panel
   */
  collapse() {
    this.isExpanded = false;

    this.updateVisibility();
  }

  /**
   * Update visibility based on current state
   */
  updateVisibility() {
    if (this.isExpanded) {
      this.dom.style.display = 'flex';

      this.contentContainer.setStyle('display', ['flex']);

      this.addClass('expanded');
    } else {
      this.dom.style.display = 'none';

      this.contentContainer.setStyle('display', ['none']);

      this.removeClass('expanded');
    }
  }

  /**
   * Set the title text
   * @param {string} text - The title text
   */
  setTitle(text) {
    const titleSpan = this.header.dom.querySelector('.Flyout-title');

    if (titleSpan) {
      titleSpan.textContent = text;
    }

    return this;
  }

  /**
   * Set the icon
   * @param {string} iconName - Material icon name
   */
  setIcon(iconName) {
    const iconEl = this.header.dom.querySelector('.Flyout-icon');

    if (iconEl) {
      iconEl.textContent = iconName;
    }

    return this;
  }

  /**
   * Set badge count (for notifications-like display)
   * @param {number|null} count - Badge count or null to hide
   */
  setBadgeCount(count) {
    this.header.dom.setAttribute('data-count', count !== null ? count.toString() : '');

    if (count !== null && count > 0) {
      this.header.addClass('Badge');
    } else {
      this.header.removeClass('Badge');
    }

    return this;
  }

  /**
   * Set the content of the panel
   * @param {Control} content - The content element
   */
  setContent(content) {
    this.contentContainer.clear();

    this.contentContainer.add(content);

    return this;
  }

  /**
   * Add content to the panel
   * @param {Control} element - Element to add
   */
  addContent(element) {
    this.contentContainer.add(element);

    return this;
  }

  /**
   * Clear the content container
   */
  clearContent() {
    this.contentContainer.clear();

    return this;
  }

  /**
   * Get the content container
   * @returns {Container} The content container
   */
  getContentContainer() {
    return this.contentContainer;
  }

  /**
   * Check if the panel is expanded
   * @returns {boolean} True if expanded
   */
  getIsExpanded() {
    return this.isExpanded;
  }

  /**
   * Position the panel relative to an element, intelligently choosing direction to stay within screen
   * @param {HTMLElement} element - The element to position relative to
   * @param {string} preferredDirection - Preferred direction ('right', 'left', 'top', 'bottom')
   */
  positionRelativeTo(element, preferredDirection = null) {
    const rect = element.getBoundingClientRect();

    // Measure the panel's size
    const panelRect = this.dom.getBoundingClientRect();

    const panelWidth = panelRect.width ;

    const panelHeight = panelRect.height;

    const margin = 0;

    // Determine preferred direction based on available space
    if (!preferredDirection) {
      const spaceRight = window.innerWidth - rect.right;

      const spaceLeft = rect.left;

      const spaceBottom = window.innerHeight - rect.bottom;

      const spaceTop = rect.top;

      const canGoRight = spaceRight >= panelWidth;

      const canGoLeft = spaceLeft >= panelWidth;

      const canGoBottom = spaceBottom >= panelHeight;

      const canGoTop = spaceTop >= panelHeight;

      if (canGoRight && spaceRight >= spaceLeft) {
        preferredDirection = 'right';
      } else if (canGoLeft) {
        preferredDirection = 'left';
      } else if (canGoBottom && spaceBottom >= spaceTop) {
        preferredDirection = 'bottom';
      } else if (canGoTop) {
        preferredDirection = 'top';
      } else {
        preferredDirection = 'right'; // fallback
      }
    }

    let top, left;

    const directions = [preferredDirection];

    if (preferredDirection === 'right') directions.push('left', 'bottom', 'top');
    else if (preferredDirection === 'left') directions.push('right', 'bottom', 'top');
    else if (preferredDirection === 'bottom') directions.push('top', 'right', 'left');
    else directions.push('bottom', 'right', 'left');

    for (const dir of directions) {
      if (dir === 'right') {
        left = rect.right + margin;

        top = rect.top 

        if (left + panelWidth <= window.innerWidth && top + panelHeight <= window.innerHeight) break;
      } else if (dir === 'left') {
        left = rect.left - panelWidth - margin;

        top = rect.top - panelHeight

        if (left >= 0 && top + panelHeight <= window.innerHeight) break;
      } else if (dir === 'bottom') {
        left = rect.left;

        top = rect.bottom + margin;

        if (top + panelHeight <= window.innerHeight && left + panelWidth <= window.innerWidth) break;
      } else if (dir === 'top') {
        left = rect.left;

        top = rect.top - panelHeight - margin;

        if (top >= 0 && left + panelWidth <= window.innerWidth) break;
      }
    }

    this.setStyle('position', ['fixed']);

    // Always use bottom positioning so panels expand upward
    const bottomValue = window.innerHeight - (top + panelHeight);

    this.setStyle('bottom', [`${bottomValue}px`]);

    this.setStyle('top', ['auto']);

    this.setStyle('left', [`${left}px`]);

    this.setStyle('z-index', ['1000']);

    return this;
  }
}

export { Flyout };
