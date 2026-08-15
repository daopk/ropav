import AutocompleteClearButton from "./autocomplete-clear-button.vue";
import AutocompleteFilter from "./autocomplete-filter.vue";
import AutocompleteIndicator from "./autocomplete-indicator.vue";
import AutocompletePopover from "./autocomplete-popover.vue";
import AutocompleteRoot from "./autocomplete-root.vue";
import AutocompleteTrigger from "./autocomplete-trigger.vue";
import AutocompleteValue from "./autocomplete-value.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
// Ordered the way the parts appear in the DOM, which is easier to read against the markup than
// alphabetical order would be.
export const Autocomplete = Object.assign(AutocompleteRoot, {
  Root: AutocompleteRoot,
  Trigger: AutocompleteTrigger,
  Value: AutocompleteValue,
  ClearButton: AutocompleteClearButton,
  Indicator: AutocompleteIndicator,
  Popover: AutocompletePopover,
  Filter: AutocompleteFilter,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  AutocompleteClearButton,
  AutocompleteFilter,
  AutocompleteIndicator,
  AutocompletePopover,
  AutocompleteRoot,
  AutocompleteTrigger,
  AutocompleteValue,
};

export type {
  AutocompleteClearButtonProps,
  AutocompleteFilterEmits,
  AutocompleteRootEmits,
  AutocompleteFilterProps,
  AutocompleteFilterSlotProps,
  AutocompleteIndicatorProps,
  AutocompletePopoverProps,
  AutocompleteRootProps,
  AutocompleteRootProps as AutocompleteProps,
  AutocompleteRootSlotProps,
  AutocompleteTriggerProps,
  AutocompleteTriggerSlotProps,
  AutocompleteValueProps,
  AutocompleteValueSlotProps,
} from "./autocomplete.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useAutocompleteContext} from "./autocomplete.context";

export type {AutocompleteContext} from "./autocomplete.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {autocompleteVariants} from "@heroui/styles";

export type {AutocompleteVariants} from "@heroui/styles";
