/**
 * Workspace shell. Region ids must stay stable — Layout looks them up:
 * RibbonMenu, HeaderBar, RibbonBar, WorkspaceLeft/Right, WorkspaceBottom,
 * Viewport, Footer, LayoutToggleBar.
 */

const demoRibbon = [
  {
    id: "RB_ProjectPanel",
    name: "Project",
    type: "Button",
    icon: "folder_open",
  },
  {
    id: "RB_PropertiesPanel",
    name: "Properties",
    type: "Button",
    icon: "tune",
  },
  {
    id: "RB_ConsolePanel",
    name: "Console",
    type: "Button",
    icon: "terminal",
  },
];

/** Workspace template. Region ids are what Layout looks up. */
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
            { id: "Logo", name: "IfcOpenShell", type: "Row" },
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
    { id: "WorkspaceBottom", name: "Bottom Workspace", type: "Workspace" },
    { id: "WorkspaceLeft", name: "Side Workspace Left", type: "Workspace" },
    { id: "WorkspaceRight", name: "Side Workspace Right", type: "Workspace" },
    {
      id: "Viewport",
      name: "Viewport",
      type: "Workspace",
      children: [
        { id: "Windows", name: "Windows Center", type: "WindowManager", children: [] },
      ],
    },
    {
      id: "Footer",
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
