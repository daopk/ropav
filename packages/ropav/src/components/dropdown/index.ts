import {MenuItemIndicator, MenuItemRoot, MenuItemSubmenuIndicator} from "../menu-item";
import {MenuSectionRoot} from "../menu-section";

import DropdownMenu from "./dropdown-menu.vue";
import DropdownPopover from "./dropdown-popover.vue";
import DropdownRoot from "./dropdown-root.vue";
import DropdownSubmenuTrigger from "./dropdown-submenu-trigger.vue";
import DropdownTrigger from "./dropdown-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/

/**
 * The item, indicator and section parts are the menu's own, re-exported under the dropdown's name.
 * They carry no dropdown-specific behaviour — the classes a dropdown wants come from the popover
 * around them — so a separate wrapper would only be a rename.
 */
export const Dropdown = Object.assign(DropdownRoot, {
  Item: MenuItemRoot,
  ItemIndicator: MenuItemIndicator,
  Menu: DropdownMenu,
  Popover: DropdownPopover,
  Root: DropdownRoot,
  Section: MenuSectionRoot,
  SubmenuIndicator: MenuItemSubmenuIndicator,
  SubmenuTrigger: DropdownSubmenuTrigger,
  Trigger: DropdownTrigger,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {DropdownMenu, DropdownPopover, DropdownRoot, DropdownSubmenuTrigger, DropdownTrigger};

export type {
  DropdownMenuProps,
  DropdownPopoverProps,
  DropdownRootEmits,
  DropdownRootProps,
  DropdownRootProps as DropdownProps,
  DropdownTriggerProps,
} from "./dropdown.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useDropdownContext, useDropdownPopoverTarget} from "./dropdown.context";

export type {DropdownContext, DropdownPopoverTarget} from "./dropdown.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {dropdownVariants} from "@heroui/styles";

export type {DropdownVariants} from "@heroui/styles";
