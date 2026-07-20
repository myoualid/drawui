/**
 * Workspace template derived from bonsai-web `configuration/config.ui.js`.
 *
 * Region ids must stay stable — WorkspaceLayout and structure.css target them:
 * RibbonMenu, HeaderBar, RibbonBar, SideWorkspaceLeft/Right, BottomWorkspace,
 * Viewport, FooterBar, LayoutToggleBar.
 */

const demoRibbon = [
  {
    id: "RB_ProjectPanel",
    name: "Project",
    type: "RibbonButton",
    icon: "folder_open",
    moduleId: "project",
  },
  {
    id: "RB_PropertiesPanel",
    name: "Properties",
    type: "RibbonButton",
    icon: "tune",
    moduleId: "properties",
  },
  {
    id: "RB_ConsolePanel",
    name: "Console",
    type: "RibbonButton",
    icon: "terminal",
    moduleId: "console",
  },
];

/** Workspace template derived from bonsai-web WorldComponent. */
export const worldConfig = {
  id: "World",
  name: "World",
  type: "World",
  style: {
    position: "absolute",
    top: "0px",
    left: "0px",
    width: "100vw",
    height: "100vh",
  },
  children: [
    {
      id: "RibbonMenu",
      name: "Ribbon Menu",
      type: "Workspace",
      children: [
        {
          id: "HeaderBar",
          name: "Header Bar",
          type: "Workspace",
          children: [
            { id: "Logo", name: "DrawUI", type: "Row" },
            {
              id: "HeaderMenu",
              name: "Header Menu",
              type: "Row",
              children: [
                { id: "LayoutToggleBar", name: "Layout Toggle Bar", type: "Row", children: [] },
              ],
            },
          ],
        },
        {
          id: "RibbonBar",
          name: "Ribbon Bar",
          type: "RibbonBar",
          children: demoRibbon,
        },
      ],
    },
    { id: "BottomWorkspace", name: "Bottom Workspace", type: "Workspace" },
    { id: "SideWorkspaceLeft", name: "Side Workspace Left", type: "Workspace" },
    { id: "SideWorkspaceRight", name: "Side Workspace Right", type: "Workspace" },
    {
      id: "Viewport",
      name: "Viewport",
      type: "Workspace",
      children: [
        { id: "Windows", name: "Windows Center", type: "WindowManager", children: [] },
      ],
    },
    {
      id: "FooterBar",
      name: "Footer Bar",
      type: "Workspace",
      children: [
        {
          id: "FooterStatus",
          name: "Templates demo",
          type: "Row",
        },
      ],
    },
  ],
};

export const layoutConfig = {
  leftOpen: true,
  rightOpen: true,
  bottomOpen: true,
  topWorkspaceHeight: 86,
  leftWorkspaceWidth: 320,
  rightWorkspaceWidth: 320,
  bottomWorkspaceHeight: 200,
  defaultSegmentHeight: 200,
  minSegmentSize: 120,
};
