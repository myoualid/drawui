// Shared public re-exports for min and full package entries (no peer dependencies).

export { ICONS } from "../icons.js";
export * from "../primitives/index.js";
export * from "../components/index.js";
export * from "../overlays/index.js";
export * from "../workspace/index.js";
export {
  makeFlexResizer,
  createSplitResizer,
  createLayoutResizerHandle,
} from "../utils/flexResizer.js";
export { buildWorkspaceDockHandlers } from "../workspace/dock.js";
