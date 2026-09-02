import type { PressEvent } from "../../composables/use-press";
import type { LinkCurrent } from "../link/link.types";
import type { SidebarCollapsible } from "./sidebar.state";
import type { SidebarVariants } from "@ropav/styles";

/** Which edge of the page the panel sits on. */
export type SidebarSide = NonNullable<SidebarVariants["side"]>;

export interface SidebarRootProps {
  class?: string;
  /** @default "left" */
  side?: SidebarSide;
  /** How the panel gets out of the way. `none` pins it open. @default "icon" */
  collapsible?: SidebarCollapsible;
  /** Whether the panel is expanded. Set, the sidebar reports a toggle rather than acting on it. */
  isExpanded?: boolean;
  /** Whether the panel starts expanded, when the caller is not controlling it. @default true */
  defaultExpanded?: boolean;
  /**
   * Whether the drawer is showing on a narrow viewport.
   *
   * Held apart from `isExpanded` on purpose: one flag across both widths would open the drawer
   * already collapsed for anyone who had collapsed the sidebar first.
   */
  isMobileOpen?: boolean;
  /** @default false */
  defaultMobileOpen?: boolean;
  /** The width the expanded panel renders at, as a CSS length. */
  width?: string;
  /** The width it starts at. Unset, the stylesheet decides and nothing is written inline. */
  defaultWidth?: string;
}

export interface SidebarRootEmits {
  expandedChange: [isExpanded: boolean];
  "update:isExpanded": [isExpanded: boolean];
  mobileOpenChange: [isOpen: boolean];
  "update:isMobileOpen": [isOpen: boolean];
  "update:width": [width: string];
}

export interface SidebarPanelProps {
  class?: string;
  /**
   * Accessible name for the landmark. Declared as `ariaLabel`, not `aria-label`: Vue normalises
   * prop names, so a hyphenated declaration would never be matched. @default "Sidebar"
   */
  ariaLabel?: string;
  /** Ids of the elements that name the landmark. */
  ariaLabelledby?: string;
}

export interface SidebarInsetProps {
  class?: string;
}

export interface SidebarHeaderProps {
  class?: string;
}

export interface SidebarContentProps {
  class?: string;
}

export interface SidebarFooterProps {
  class?: string;
}

export interface SidebarGroupProps {
  class?: string;
  /** Names the group where no `Sidebar.GroupLabel` does. */
  ariaLabel?: string;
}

export interface SidebarGroupLabelProps {
  class?: string;
}

export interface SidebarSeparatorProps {
  class?: string;
}

export interface SidebarItemProps {
  class?: string;
  /** Where the item goes. Without one it renders as a button, for a nav that acts rather than
   * navigates. */
  href?: string;
  target?: string;
  rel?: string;
  /** Marks the item as the one for the current page. `"auto"` asks the router instead. */
  ariaCurrent?: LinkCurrent;
  /**
   * Passed through to the router's `navigate` alongside the href, for whatever options the
   * application's router accepts. Ignored without a `RouterProvider` above.
   */
  routerOptions?: unknown;
  isDisabled?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

export interface SidebarItemEmits {
  press: [event: PressEvent];
}

export interface SidebarItemIconProps {
  class?: string;
}

export interface SidebarItemLabelProps {
  class?: string;
}

export interface SidebarItemTrailingProps {
  class?: string;
}

/** State an item hands to its slot, matching the link's render props plus the sidebar's shape. */
export interface SidebarItemSlotProps {
  isCurrent: boolean;
  isDisabled: boolean;
  isHovered: boolean;
  isPressed: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  /** Whether the sidebar has narrowed to its rail, so a caller can hang a tooltip off it. */
  isCollapsed: boolean;
}

export interface SidebarTriggerProps {
  class?: string;
  isDisabled?: boolean;
  /** @default "Toggle sidebar" */
  ariaLabel?: string;
}

/** State the root hands to its slot. */
export interface SidebarSlotProps {
  side: SidebarSide;
  collapsible: SidebarCollapsible;
  isOpen: boolean;
  isExpanded: boolean;
  /** Narrowed rather than hidden. Always false where the panel is a drawer. */
  isCollapsed: boolean;
  isMobile: boolean;
}

/** State a part reading only the sidebar's shape hands to its slot. */
export interface SidebarPartSlotProps {
  isCollapsed: boolean;
  isOpen: boolean;
  isMobile: boolean;
}

/** State the trigger hands to its slot. */
export interface SidebarTriggerSlotProps {
  isOpen: boolean;
  isCollapsed: boolean;
  isHovered: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isPressed: boolean;
  isDisabled: boolean;
}
