import DisclosureGroupRoot from "./disclosure-group-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { DisclosureGroupRoot as DisclosureGroup };

export type { DisclosureGroupRootProps as DisclosureGroupProps } from "./disclosure-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useDisclosureGroupContext } from "./disclosure-group.context";

export type { DisclosureGroupContext } from "./disclosure-group.context";

/* -------------------------------------------------------------------------------------------------
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export { useDisclosureGroupNavigation } from "../../composables/use-disclosure-group-navigation";

export type {
  UseDisclosureGroupNavigationOptions,
  UseDisclosureGroupNavigationReturn,
} from "../../composables/use-disclosure-group-navigation";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { disclosureGroupVariants } from "@ropav/styles";

export type { DisclosureGroupVariants } from "@ropav/styles";
