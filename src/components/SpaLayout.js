import {
  UIColumn,
  UIListbox,
  ListboxItem,
  UISmallText,
  UIText,
  UITabbedPanel,
  UIHorizontalRule,
} from "../primitives/ui.js";
import { CollapsibleSection } from "./CollapsibleSection.js";
import { SidebarLayout } from "./SidebarLayout.js";

/**
 * @typedef {Object} SpaPage
 * @property {string} id - Unique route id (hash segment)
 * @property {string} label - Page title shown in the main header
 * @property {string} [subtitle] - Optional subtitle under the main title
 * @property {() => import("../primitives/ui.js").UIElement} render - Main body factory
 */

/**
 * @typedef {Object} SpaNavGroup
 * @property {string} id - Group id
 * @property {string} label - Sidebar group label
 * @property {string} [icon] - Material icon name
 * @property {boolean} [collapsed] - Initial collapsed state
 * @property {SpaPage[]} [items] - Routable pages (leaf groups)
 * @property {SpaNavGroup[]} [groups] - Nested child groups (one level)
 * @property {"divider"|"heading"} [type] - Sidebar nav marker (divider or section heading)
 */

/**
 * @typedef {Object} SpaLayoutOptions
 * @property {string} [sidebarTitle] - Sidebar header title
 * @property {SpaNavGroup[]} [groups] - Navigation groups and pages
 * @property {(pageId: string, page: SpaPage) => void} [onNavigate]
 * @property {import("./SidebarLayout.js").SidebarLayoutOptions} [layout] - SidebarLayout options
 */

class SpaLayout extends SidebarLayout {
  /**
   * @param {SpaLayoutOptions} [options]
   */
  constructor(options = {}) {
    const { sidebarTitle = "", groups = [], onNavigate = null, layout = {} } = options;

    super({
      sidebarWidth: "260px",
      sidebarMinWidth: "220px",
      sidebarMaxWidth: "320px",
      ...layout,
    });

    this.addClass("SpaLayout");
    this.setStyle("height", ["100%"]);
    this.setStyle("minHeight", ["0"]);

    /** @type {Map<string, SpaPage & { groupId: string, parentGroupId?: string }>} */
    this.pages = new Map();
    /** @type {SpaNavGroup[]} */
    this.groups = [];
    /** @type {Map<string, UIListbox>} */
    this.groupLists = new Map();
    /** @type {Map<string, CollapsibleSection>} */
    this.groupSections = new Map();
    /** @type {UITabbedPanel | null} */
    this.parentTabs = null;
    /** @type {string|null} */
    this.currentPageId = null;
    /** @type {Map<string, import("../primitives/ui.js").UIElement>} */
    this.pageCache = new Map();
    this.onNavigate = onNavigate;

    this.mainTitle = new UIText("");
    this.mainTitle.setClass("Title");

    this.mainSubtitle = new UISmallText("");
    this.mainSubtitle.setStyle("display", ["block"]);
    this.mainSubtitle.setStyle("marginTop", ["0.25rem"]);

    const headerText = new UIColumn();
    headerText.gap("0");
    headerText.add(this.mainTitle, this.mainSubtitle);

    this.mainHeaderContent.clear();
    this.mainHeaderContent.add(headerText);

    this.mainBody.setStyle("overflow", ["auto"]);
    this.mainBody.addClass("SpaLayout-body");

    this.navHost = new UIColumn();
    this.navHost.gap("0.25rem");
    this.navHost.addClass("SpaLayout-nav");

    this.setSidebarTitle(sidebarTitle);
    this.setSidebarContent(this.navHost);

    if (groups.length) {
      this.setGroups(groups);
    }

    this._onHashChange = () => {
      const pageId = window.location.hash.replace(/^#/, "");
      if (pageId && this.pages.has(pageId) && pageId !== this.currentPageId) {
        this.navigate(pageId, { updateHash: false });
      }
    };
  }

  /**
   * @param {SpaNavGroup} leaf
   * @param {CollapsibleSection} section
   * @param {{ parentGroupId?: string }} [meta]
   */
  mountLeafGroup(leaf, section, { parentGroupId } = {}) {
    const list = new UIListbox();

    (leaf.items ?? []).forEach((item) => {
      this.pages.set(item.id, {
        ...item,
        groupId: leaf.id,
        ...(parentGroupId ? { parentGroupId } : {}),
      });

      const listItem = new ListboxItem(list);
      listItem.setId(item.id);
      listItem.setTextContent(item.label);
      list.add(listItem);
    });

    list.dom.addEventListener("change", () => {
      const value = list.getValue();
      if (value && value !== this.currentPageId) {
        this.navigate(value);
      }
    });

    section.setContent(list);
    this.groupSections.set(leaf.id, section);
    this.groupLists.set(leaf.id, list);
  }

  /**
   * @param {SpaNavGroup} group
   * @param {{ parentGroupId?: string, expandFirst?: boolean }} [meta]
   * @returns {UIColumn}
   */
  buildLeafColumn(group, { parentGroupId, expandFirst = false } = {}) {
    const host = new UIColumn();
    host.gap("0.25rem");
    host.addClass("SpaLayout-nestedGroups");

    const leaves = group.groups ?? [];
    let leafIndex = 0;
    leaves.forEach((child) => {
      if (child.type === "divider") {
        const rule = new UIHorizontalRule();
        rule.addClass("SpaLayout-navDivider");
        host.add(rule);
        return;
      }

      if (child.type === "heading") {
        const heading = new UIText(child.label ?? "");
        heading.addClass("SpaLayout-navHeading");
        host.add(heading);
        return;
      }

      const childSection = new CollapsibleSection({
        title: child.label,
        icon: child.icon ?? null,
        collapsed: child.collapsed ?? !(expandFirst && leafIndex === 0),
      });
      this.mountLeafGroup(child, childSection, { parentGroupId });
      host.add(childSection);
      leafIndex += 1;
    });

    return host;
  }

  /**
   * @param {SpaNavGroup[]} groups
   */
  setGroups(groups) {
    this.navHost.clear();
    this.pages.clear();
    this.groupLists.clear();
    this.groupSections.clear();
    this.pageCache.clear();
    this.parentTabs = null;
    this.groups = groups;

    const allNested =
      groups.length > 0 &&
      groups.every((group) => Array.isArray(group.groups) && group.groups.length > 0);

    if (allNested) {
      this.navHost.addClass("SpaLayout-nav--tabs");
      const tabs = new UITabbedPanel();
      tabs.addClass("SpaLayout-groupTabs");
      this.parentTabs = tabs;

      groups.forEach((group, index) => {
        const panel = this.buildLeafColumn(group, {
          parentGroupId: group.id,
          expandFirst: index === 0,
        });
        tabs.addTab(group.id, group.label, panel);
      });

      this.navHost.add(tabs);
      return;
    }

    this.navHost.removeClass("SpaLayout-nav--tabs");

    groups.forEach((group, index) => {
      const section = new CollapsibleSection({
        title: group.label,
        icon: group.icon ?? null,
        collapsed: group.collapsed ?? index !== 0,
      });

      this.mountLeafGroup(group, section);
      this.navHost.add(section);
    });
  }

  /**
   * @param {UIListbox} list
   * @param {string} pageId
   */
  syncListSelection(list, pageId) {
    for (let i = 0; i < list.listitems.length; i++) {
      const element = list.listitems[i];
      if (element.getId() === pageId) {
        element.addClass("Active");
      } else {
        element.removeClass("Active");
      }
    }

    list.selectedValue = pageId;
  }

  /**
   * @param {string} pageId
   * @param {{ updateHash?: boolean }} [options]
   */
  navigate(pageId, { updateHash = true } = {}) {
    const page = this.pages.get(pageId);
    if (!page) {
      return this;
    }

    this.currentPageId = pageId;

    if (this.parentTabs && page.parentGroupId) {
      this.parentTabs.select(page.parentGroupId);
    }

    this.groupSections.forEach((section, groupId) => {
      if (groupId === page.groupId) {
        section.expand();
      } else {
        section.collapse();
      }
    });

    const list = this.groupLists.get(page.groupId);
    if (list) {
      this.syncListSelection(list, pageId);
    }

    this.mainTitle.setTextContent(page.label);
    this.mainSubtitle.setTextContent(page.subtitle ?? "");
    this.mainSubtitle.setHidden(!page.subtitle);

    this.mainBody.clear();

    let content = this.pageCache.get(pageId);
    if (!content) {
      content = page.render();
      this.pageCache.set(pageId, content);
    }

    this.mainBody.add(content);

    if (updateHash) {
      history.replaceState(null, "", `#${pageId}`);
    }

    if (typeof this.onNavigate === "function") {
      this.onNavigate(pageId, page);
    }

    return this;
  }

  /**
   * @param {SpaNavGroup} group
   * @returns {SpaPage | undefined}
   */
  firstPageInGroup(group) {
    if (group.type === "divider" || group.type === "heading") {
      return undefined;
    }
    if (group.items?.length) {
      return group.items[0];
    }
    if (group.groups?.length) {
      for (const child of group.groups) {
        const page = this.firstPageInGroup(child);
        if (page) return page;
      }
    }
    return undefined;
  }

  /**
   * Resolve initial route from hash or first page.
   */
  start() {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && this.pages.has(hash)) {
      this.navigate(hash, { updateHash: false });
    } else {
      for (const group of this.groups) {
        const firstPage = this.firstPageInGroup(group);
        if (firstPage) {
          this.navigate(firstPage.id, { updateHash: false });
          break;
        }
      }
    }

    window.addEventListener("hashchange", this._onHashChange);
    return this;
  }

  destroy() {
    window.removeEventListener("hashchange", this._onHashChange);
    this.pageCache.clear();
  }
}

export { SpaLayout };
