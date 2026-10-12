// Shared public re-exports for the GUI entry (no peer dependencies, no layout engine).

export { ICONS } from "../icons.js";
export * from "../primitives/index.js";
export * from "../components/index.js";
export * from "../overlays/index.js";
export {
  makeFlexResizer,
  createSplitResizer,
  createLayoutResizerHandle,
} from "../utils/flexResizer.js";
