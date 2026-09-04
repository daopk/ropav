import DropdownMenu from "./dropdown-menu.vue";
import DropdownPopover from "./dropdown-popover.vue";
import DropdownRoot from "./dropdown-root.vue";
import DropdownSubmenuTrigger from "./dropdown-submenu-trigger.vue";
import DropdownTrigger from "./dropdown-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  DropdownMenu,
  DropdownPopover,
  DropdownRoot as Dropdown,
  DropdownSubmenuTrigger,
  DropdownTrigger,
};

export type {
  DropdownMenuProps,
  DropdownPopoverProps,
  DropdownRootEmits as DropdownEmits,
  DropdownRootProps as DropdownProps,
  DropdownTriggerProps,
} from "./dropdown.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useDropdownContext, useDropdownPopoverTarget } from "./dropdown.context";

export type { DropdownContext, DropdownPopoverTarget } from "./dropdown.context";

/* -------------------------------------------------------------------------------------------------
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export type { MenuTriggerType } from "../../composables/use-menu-trigger";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { dropdownVariants } from "@ropav/styles";

export type { DropdownVariants } from "@ropav/styles";
