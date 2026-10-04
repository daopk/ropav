export interface PortalProviderFixtureProps {
  container?: HTMLElement | null;
  root?: HTMLElement | null;
  open?: "modal" | "popover" | "tooltip";
}

export interface PortalProviderPlacementFixtureProps {
  container?: HTMLElement | null;
  root?: HTMLElement | null;
  open?: "popover" | "tooltip";
  /** Where each trigger sits, as inline style, so a case can put it near an edge of the root. */
  popoverTriggerStyle?: string;
  tooltipTriggerStyle?: string;
}
