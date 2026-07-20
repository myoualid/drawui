import { Container, Icon, Image, TextBlock, RibbonButton } from "../../primitives/ui.js";
import { RibbonBar } from "../../components/panels/RibbonBar.js";

/**
 * Build the #World shell DOM tree from a declarative UI config tree.
 *
 * This mirrors the bonsai-web `WorldComponent` pattern: workspace regions are
 * created with stable ids (`SideWorkspaceLeft`, `Viewport`, …) so
 * {@link WorkspaceLayout} can attach grid tracks, resizers, and workspace stacks.
 *
 * @category Shell
 * @typedef {Object} WorldComponentNode
 * @property {string} id
 * @property {string} [name]
 * @property {string} [type]
 * @property {number} [priority]
 * @property {string} [icon]
 * @property {string} [moduleId]
 * @property {string} [workModeContext]
 * @property {boolean} [disabled]
 * @property {boolean} [needsCount]
 * @property {string} [url]
 * @property {Object<string, string>} [style]
 * @property {WorldComponentNode[]} [children]
 */

/**
 * @param {WorldComponentNode} component
 * @param {HTMLElement} [container=document.body]
 * @param {Object} [options={}]
 * @param {Set<string>} [options.knownModuleIds]
 * @param {string[]} [options.activeModuleIds]
 * @returns {{ root: Container, mount: (parent?: HTMLElement) => void }}
 *
 * @example <caption>Note</caption>
 * // live
 * return new Disclaimer(
 *   "buildWorldFromConfig builds an app shell into a host — see docs/examples/templates.",
 * );
 *
 * @category Shell
 */
export function buildWorldFromConfig(component, container = document.body, options = {}) {
  const knownModuleIds = options.knownModuleIds ?? new Set();
  const activeModuleIds = options.activeModuleIds ?? [];
  const rootHolder = { root: null };

  walkComponent(component, null, {
    knownModuleIds,
    activeModuleIds,
    rootHolder,
  });

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
  if (shouldHideModule(component, ctx.activeModuleIds, ctx.knownModuleIds)) {
    return;
  }

  if (isRibbonButtonNode(component, parent)) {
    placeRibbonButton(component, parent);
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

  if (component.priority !== undefined) {
    div.dom.dataset.priority = String(component.priority);
  }

  if (component.style) {
    div.setStyles(component.style);
  }

  if (component.type === "ContextModules" && component.workModeContext) {
    div.dom.dataset.workModeContext = component.workModeContext;
  }

  decorateNode(div, component);

  let childParent = div;

  if (component.icon && Array.isArray(component.children) && component.children.length > 0) {
    childParent = new Container().addClass("Modules");
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
    return new RibbonBar([], "flex-start");
  }
  return new Container();
}

/**
 * @param {WorldComponentNode} component
 * @param {Container|null} [parent]
 * @returns {boolean}
 */
function isRibbonButtonNode(component, parent = null) {
  if (component.type === "RibbonButton") return true;
  // Legacy alias: leaf ContextModules under the app RibbonBar become RibbonButtons.
  return component.type === "ContextModules"
    && !component.children?.length
    && Boolean(parent?.dom?.classList?.contains("RibbonBar") || parent?.dom?.id === "RibbonBar");
}

/**
 * @param {WorldComponentNode} component
 * @param {Container|null} parent
 */
function placeRibbonButton(component, parent) {
  const button = new RibbonButton(component.name ?? "", {
    icon: component.icon || "widgets",
  });

  if (component.id) {
    button.setId(component.id);
    button.addClass(component.id);
  }

  button.dom.dataset.type = "RibbonButton";
  if (component.moduleId) {
    button.dom.dataset.moduleId = component.moduleId;
  }
  if (component.workModeContext) {
    button.dom.dataset.workModeContext = component.workModeContext;
  }
  if (component.priority !== undefined) {
    button.dom.dataset.priority = String(component.priority);
  }
  if (component.disabled) {
    button.setStyle("opacity", "0.5");
  }
  if (component.style) {
    button.setStyles(component.style);
  }

  if (component.needsCount) {
    const count = new TextBlock("0").addClass("ModuleCount");
    count.setId(`${component.id}Count`);
    button.add(count);
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
      div.add(new TextBlock(component.name ?? "App").addClass("LogoText"));
    }
    return;
  }

  if (component.type === "ContextModules") {
    if (component.icon) {
      div.add(new Icon(component.icon).addClass("ModuleIcon"));
    }
    div.add(new TextBlock(component.name ?? "").addClass("ModuleName"));
  } else if (component.icon) {
    div.add(new Icon(component.icon));
  }

  if (component.needsCount) {
    const count = new TextBlock("0").addClass("ModuleCount");
    count.setId(`${component.id}Count`);
    div.add(count);
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
 * @param {WorldComponentNode} component
 * @param {string[]} activeIds
 * @param {Set<string>} knownModuleIds
 * @category Shell
 */
function shouldHideModule(component, activeIds, knownModuleIds) {
  if (!component.moduleId || activeIds.length === 0) {
    return false;
  }

  if (!knownModuleIds.has(component.moduleId)) {
    return component.type !== "RibbonButton" && component.type !== "ContextModules";
  }

  return !activeIds.includes(component.moduleId);
}

/**
 * Default workspace shell matching bonsai-web `WorldComponent` region ids.
 * Apps extend `children` (ribbon modules, footer widgets, viewport overlays).
 *
 * @example <caption>Note</caption>
 * // live
 * return new Disclaimer(
 *   "createDefaultWorldConfig returns a config object, not a Control.",
 * );
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
              { id: "Logo", name: "DrawUI", type: "Row" },
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
      { id: "BottomWorkspace", type: "Workspace" },
      { id: "SideWorkspaceLeft", type: "Workspace" },
      { id: "SideWorkspaceRight", type: "Workspace" },
      {
        id: "Viewport",
        type: "Workspace",
        children: [
          { id: "Windows", type: "WindowManager", children: [] },
        ],
      },
      { id: "FooterBar", type: "Workspace", children: [] },
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
