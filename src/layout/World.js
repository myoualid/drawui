import { buildWorldFromConfig, createDefaultWorldConfig } from "../workspace/internal/WorldBuilder.js";

/**
 * Application shell. The default constructor builds the standard regions
 * (ribbon, left, right, bottom, viewport, footer). Pass a config node that
 * has an `id` to use that tree instead.
 *
 * Region ids the layout looks up: `RibbonMenu`, `HeaderBar`, `LayoutToggleBar`,
 * `WorkspaceLeft`, `WorkspaceRight`, `WorkspaceBottom`, `Viewport`, `Footer`.
 *
 * @example
 * const world = new World();
 * world.mount(document.body);
 *
 * const layout = new Layout({ leftOpen: true }).init(world);
 *
 * @category Shell
 */
export class World {
  /**
   * @param {object} [config] World tree. A node with `id` replaces the default tree.
   * @param {object} [options]
   * @param {HTMLElement} [options.container] Parent used when `mount` has not been called yet.
   */
  constructor(config = {}, options = {}) {
    const tree = config?.id ? config : createDefaultWorldConfig(config);
    const built = buildWorldFromConfig(tree, options.container ?? document.body);
    this.root = built.root;
    this._mount = built.mount;
  }

  /** @returns {HTMLElement|null} */
  get dom() {
    return this.root?.dom ?? null;
  }

  /**
   * @param {HTMLElement} [parent=document.body]
   * @returns {this}
   */
  mount(parent = document.body) {
    this._mount(parent);
    return this;
  }
}
