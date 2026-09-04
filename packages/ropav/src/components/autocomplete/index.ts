import AutocompleteClearButton from "./autocomplete-clear-button.vue";
import AutocompleteFilter from "./autocomplete-filter.vue";
import AutocompleteIndicator from "./autocomplete-indicator.vue";
import AutocompletePopover from "./autocomplete-popover.vue";
import AutocompleteRoot from "./autocomplete-root.vue";
import AutocompleteTrigger from "./autocomplete-trigger.vue";
import AutocompleteValue from "./autocomplete-value.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  AutocompleteClearButton,
  AutocompleteFilter,
  AutocompleteIndicator,
  AutocompletePopover,
  AutocompleteRoot as Autocomplete,
  AutocompleteTrigger,
  AutocompleteValue,
};

export type {
  AutocompleteClearButtonProps,
  AutocompleteFilterEmits,
  AutocompleteRootEmits as AutocompleteEmits,
  AutocompleteFilterProps,
  AutocompleteFilterSlotProps,
  AutocompleteIndicatorProps,
  AutocompletePopoverProps,
  AutocompleteRootProps as AutocompleteProps,
  AutocompleteRootSlotProps as AutocompleteSlotProps,
  AutocompleteTriggerProps,
  AutocompleteTriggerSlotProps,
  AutocompleteValueProps,
  AutocompleteValueSlotProps,
} from "./autocomplete.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useAutocompleteContext } from "./autocomplete.context";

export type { AutocompleteContext } from "./autocomplete.context";

/* -------------------------------------------------------------------------------------------------
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export type { UseSelectReturn } from "../../composables/use-select";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { autocompleteVariants } from "@ropav/styles";

export type { AutocompleteVariants } from "@ropav/styles";
