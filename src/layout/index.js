import { WorkspaceLayout } from "../workspace/WorkspaceLayout.js";
import { WorkspacePanel } from "../components/panels/WorkspacePanel.js";
import { World } from "./World.js";

Object.assign(WorkspaceLayout, {
  World,
  Panel: WorkspacePanel,
});

/**
 * Docking shell: {@link World}, {@link Layout}, and {@link Panel}.
 *
 * @packageDocumentation
 * @category Shell
 */
export { WorkspaceLayout as Layout };
export { World };
export { WorkspacePanel as Panel };
