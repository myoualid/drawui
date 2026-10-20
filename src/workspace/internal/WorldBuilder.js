import { Container, Icon, Image, Text, Button, InputDropdown } from "../../primitives/ui.js";
import { RibbonBar } from "../../components/panels/RibbonBar.js";

/**
 * Build the #World shell DOM tree from a declarative config.
 *
 * Region ids stay stable (`WorkspaceLeft`, `Viewport`, …) so
 * {@link WorkspaceLayout} can attach grid tracks, resizers, and stacks.
 * A node is `{ id, name?, type?, icon?, url?, style?, disabled?, children? }`.
 * Inside a ribbon, `type: "Button"` becomes a button, `type: "Dropdown"` becomes
 * a labeled menu (`options`, `value`), and `type: "RibbonGroup"` is a category
 * whose `name` sits under its children. Everything else is a container.
 *
 * @category Shell
 * @typedef {Object} WorldComponentNode
 * @property {string} id
 * @property {string} [name]
 * @property {string} [type]
 * @property {string} [icon]
 * @property {string} [url]
 * @property {boolean} [disabled]
 * @property {Object<string, string>} [style]
 * @property {WorldComponentNode[]} [children]
 */

/**
 * @param {WorldComponentNode} component
 * @param {HTMLElement} [container=document.body]
 * @returns {{ root: Container, mount: (parent?: HTMLElement) => void }}
 *
 * @category Shell
 */
export function buildWorldFromConfig(component, container = document.body) {
  const rootHolder = { root: null };

  walkComponent(component, null, { rootHolder });

  const root = rootHolder.root;
  if (!root) {
    throw new Error("World config must include a root node with id \"World\"");
  }

  return {
    root,
    mount(parent = container) {
      parent.appendChild(root.dom);
    },
  };
}

/**
 * @param {WorldComponentNode} component
 * @param {Container|null} parent
 * @param {Object} ctx
 */
function walkComponent(component, parent, ctx) {
  if (isRibbonGroupNode(component, parent)) {
    placeRibbonGroup(component, parent, ctx);
    return;
  }

  if (isRibbonControlNode(component, parent)) {
    placeRibbonControl(component, parent);
    return;
  }

  const isRoot = !parent && component.id === "World";
  let div = isRoot && ctx.rootHolder.root
    ? ctx.rootHolder.root
    : createShellNode(component);

  if (isRoot) {
    ctx.rootHolder.root = div;
  } else if (parent) {
    parent.add(div);
  }

  div.setId(component.id);
  div.addClass(component.id);
  if (component.type) {
    div.addClass(component.type);
    div.dom.dataset.type = component.type;
  }

  if (component.style) {
    div.setStyles(component.style);
  }

  decorateNode(div, component);

  let childParent = div;

  if (component.icon && Array.isArray(component.children) && component.children.length > 0) {
    childParent = new Container().addClass("Group");
    div.add(childParent);
  }

  for (const child of component.children ?? []) {
    walkComponent(child, childParent, ctx);
  }
}

/**
 * @param {WorldComponentNode} component
 * @returns {Container|RibbonBar}
 */
function createShellNode(component) {
  if (component.id === "RibbonBar" || component.type === "RibbonBar") {
    return new RibbonBar([]);
  }
  return new Container();
}

/**
 * @param {Container|null} parent
 * @returns {boolean}
 */
function inRibbon(parent) {
  let node = parent?.dom ?? null;
  while (node) {
    if (node.classList?.contains("RibbonBar") || node.id === "RibbonBar") return true;
    node = node.parentElement;
  }
  return false;
}

/**
 * @param {WorldComponentNode} component
 * @param {Container|null} [parent]
 * @returns {boolean}
 */
function isRibbonGroupNode(component, parent = null) {
  return inRibbon(parent) && component.type === "RibbonGroup";
}

/**
 * @param {WorldComponentNode} component
 * @param {Container|null} [parent]
 * @returns {boolean}
 */
function isRibbonControlNode(component, parent = null) {
  if (!inRibbon(parent)) return false;
  return component.type === "Button" || component.type === "Dropdown";
}

/**
 * Category column: ribbon controls, then the caption along the bottom.
 * @param {WorldComponentNode} component
 * @param {Container|null} parent
 * @param {Object} ctx
 */
function placeRibbonGroup(component, parent, ctx) {
  const group = new Container().addClass("RibbonGroup");
  if (component.id) {
    group.setId(component.id);
    group.addClass(component.id);
  }
  group.dom.dataset.type = "RibbonGroup";

  const items = new Container().addClass("RibbonGroup-items");
  group.add(items);
  if (component.name) {
    group.add(new Text(component.name).addClass("RibbonGroup-label"));
  }
  parent?.add(group);

  for (const child of component.children ?? []) {
    walkComponent(child, items, ctx);
  }
}

/**
 * @param {WorldComponentNode} component
 * @param {Container|null} parent
 */
function placeRibbonControl(component, parent) {
  if (component.type === "Dropdown") {
    placeRibbonDropdown(component, parent);
    return;
  }
  placeRibbonButton(component, parent);
}

/**
 * Label on top, menu underneath. The select keeps `id` so hosts can bind it.
 * @param {WorldComponentNode} component
 * @param {Container|null} parent
 */
function placeRibbonDropdown(component, parent) {
  const select = new InputDropdown();
  const options = {};
  for (const option of component.options ?? []) {
    const value = option.value ?? option.id;
    if (value == null) continue;
    options[value] = option.name ?? String(value);
  }
  select.setOptions(options);
  if (component.value != null) select.setValue(component.value);

  if (component.id) {
    select.setId(component.id);
    select.addClass(component.id);
  }
  select.dom.dataset.type = "Dropdown";
  if (component.disabled) select.dom.disabled = true;

  const hosted = component.name
    ? new Container()
      .addClass("RibbonDropdown")
      .add(new Text(component.name).addClass("RibbonDropdown-label"))
      .add(select)
    : select;

  if (component.style && hosted !== select) {
    hosted.setStyles(component.style);
  }
  parent?.add(hosted);
}

/**
 * @param {WorldComponentNode} component
 * @param {Container|null} parent
 */
function placeRibbonButton(component, parent) {
  const button = new Button(component.name ?? "");
  if (component.icon) button.setIcon(component.icon);

  if (component.id) {
    button.setId(component.id);
    button.addClass(component.id);
  }

  button.dom.dataset.type = "Button";
  if (component.disabled) {
    button.setStyle("opacity", "0.5");
  }
  if (component.style) {
    button.setStyles(component.style);
  }

  parent?.add(button);
}

/**
 * @param {Container} div
 * @param {WorldComponentNode} component
 * @category Shell
 */
function decorateNode(div, component) {
  if (component.id === "Logo") {
    if (component.type === "Image" && component.url) {
      div.add(new Image(component.url));
    } else {
      div.add(new Text(component.name ?? "App").addClass("LogoText"));
    }
    return;
  }

  if (component.icon) {
    div.add(new Icon(component.icon));
  }

  if (component.type === "Image" && component.url && component.id !== "Logo") {
    div.add(new Image(component.url));
  }

  if (component.disabled) {
    div.setStyle("opacity", "0.5");
  }

  if (component.id === "FullScreenToggle") {
    div.dom.addEventListener("click", () => {
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      } else {
        void document.body.requestFullscreen();
      }
    });
  }

  if (component.id === "ApplicationStateBar") {
    div.setStyles({
      position: "absolute",
      inset: "0",
      pointerEvents: "none",
    });
  }
}

/**
 * Default workspace shell. Region ids are what {@link WorkspaceLayout} looks up.
 * Pass `children` on `new World(config)` to replace the whole tree, or edit a
 * copy of this config before constructing `World`.
 *
 * @category Shell
 * @param {Partial<WorldComponentNode>} [overrides={}]
 * @returns {WorldComponentNode}
 */
export function createDefaultWorldConfig(overrides = {}) {
  const base = {
    id: "World",
    name: "World",
    type: "World",
    style: {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
    },
    children: [
      {
        id: "RibbonMenu",
        type: "Workspace",
        children: [
          {
            id: "HeaderBar",
            type: "Workspace",
            children: [
              { id: "Logo", name: "GUI", type: "Row" },
              {
                id: "HeaderMenu",
                type: "Row",
                children: [
                  { id: "LayoutToggleBar", type: "Row", children: [] },
                ],
              },
            ],
          },
          { id: "RibbonBar", type: "RibbonBar", children: [] },
        ],
      },
      { id: "WorkspaceBottom", type: "Workspace" },
      { id: "WorkspaceLeft", type: "Workspace" },
      { id: "WorkspaceRight", type: "Workspace" },
      {
        id: "Viewport",
        type: "Workspace",
        children: [
          { id: "Windows", type: "WindowManager", children: [] },
        ],
      },
      { id: "Footer", type: "Workspace", children: [] },
    ],
  };

  return mergeWorldConfig(base, overrides);
}

/**
 * @param {WorldComponentNode} base
 * @param {Partial<WorldComponentNode>} overrides
 * @returns {WorldComponentNode}
 * @category Shell
 */
function mergeWorldConfig(base, overrides) {
  const merged = { ...base, ...overrides };
  if (Array.isArray(overrides.children)) {
    merged.children = overrides.children;
  } else if (Array.isArray(base.children)) {
    merged.children = base.children;
  }
  return merged;
}
