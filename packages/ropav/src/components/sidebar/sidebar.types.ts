import type { PressEvent } from "../../composables/use-press";
import type { LinkCurrent } from "../link/link.types";
import type { SidebarCollapsibleMode } from "./sidebar.state";
import type { SidebarVariants } from "@ropav/styles";

/** Which edge of the page the panel sits on. */
export type SidebarSide = NonNullable<SidebarVariants["side"]>;

export interface SidebarRootProps {
  class?: string;
  /** @default "left" */
  side?: SidebarSide;
  /** How the panel gets out of the way. `none` pins it open. @default "icon" */
  collapsible?: SidebarCollapsibleMode;
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
  /**
   * Where the sidebar is remembered between visits, under `ropav:sidebar:<id>` in `localStorage`.
   *
   * The wide-viewport state only: whether the panel was left expanded and how wide it was. What
   * the drawer was doing is not worth restoring — it is opened to be used and closed when it is.
   */
  autoSaveId?: string;
  /**
   * The viewport at or below which the panel becomes a drawer, as a media query.
   *
   * Written as a query rather than a number so a caller can key it to whatever their layout
   * actually needs — a container, an orientation, a coarse pointer. @default "(max-width: 47.99rem)"
   */
  breakpoint?: string;
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

export interface SidebarRailProps {
  class?: string;
  /**
   * Whether dragging the rail resizes the panel. Off, it is a toggle strip and nothing else.
   * @default false
   */
  isResizable?: boolean;
  /** Suppresses both gestures. */
  isDisabled?: boolean;
  /** Narrowest width a drag may reach, in pixels. @default 180 */
  minWidth?: number;
  /** Widest width a drag may reach, in pixels. @default 480 */
  maxWidth?: number;
  /** How far one arrow press moves the edge, in pixels. @default 10 */
  keyboardStep?: number;
  /** How far a shift-arrow press moves it, in pixels. @default 50 */
  keyboardLargeStep?: number;
  /** @default "Resize sidebar" when it resizes, "Toggle sidebar" when it only toggles */
  ariaLabel?: string;
  ariaLabelledby?: string;
}

/** State the rail hands to its slot. */
export interface SidebarRailSlotProps {
  isDragging: boolean;
  isHovered: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
  isResizable: boolean;
  isCollapsed: boolean;
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

export interface SidebarCollapsibleProps {
  class?: string;
  /** Whether the rows under this item are showing. Set, it reports a toggle rather than acting. */
  isExpanded?: boolean;
  /** Whether they start showing, when the caller is not controlling it. @default false */
  defaultExpanded?: boolean;
  isDisabled?: boolean;
}

export interface SidebarCollapsibleEmits {
  expandedChange: [isExpanded: boolean];
  "update:isExpanded": [isExpanded: boolean];
}

export interface SidebarCollapsibleTriggerProps {
  class?: string;
  isDisabled?: boolean;
  ariaLabel?: string;
}

export interface SidebarSubMenuProps {
  class?: string;
  /** Names the list of children. @default the trigger names it */
  ariaLabel?: string;
}

export interface SidebarItemIndicatorProps {
  class?: string;
}

/** State a collapsible item hands to its slot. */
export interface SidebarCollapsibleSlotProps {
  isExpanded: boolean;
  isDisabled: boolean;
  /** Whether the sidebar itself has narrowed to its rail, where the children are not rendered. */
  isCollapsed: boolean;
}

/** State the trigger hands to its slot. */
export interface SidebarCollapsibleTriggerSlotProps extends SidebarCollapsibleSlotProps {
  isHovered: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isPressed: boolean;
}

export interface SidebarItemTooltipProps {
  class?: string;
  /**
   * What the tooltip says — the item's own label, which the rail has taken out of sight.
   *
   * Restated rather than read off `Sidebar.ItemLabel`, because the label is a slot and its text is
   * whatever a caller rendered into it; reaching into the DOM to find out would tie the tooltip to
   * a markup shape neither part promises.
   */
  label?: string;
  /**
   * How long the pointer has to rest on the item before the tooltip opens.
   *
   * Left to the theme's `--tooltip-delay` by default, the same as every other tooltip. A rail is a
   * good reason to want this shorter — the label is the only way to read the item, not a hint
   * beside one — but that is a decision about the whole product's tooltips, not about this part.
   */
  delay?: number;
  /** How long it stays after the pointer leaves. Left to the theme by default. */
  closeDelay?: number;
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
  collapsible: SidebarCollapsibleMode;
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
