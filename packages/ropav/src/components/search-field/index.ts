import SearchFieldClearButton from "./search-field-clear-button.vue";
import SearchFieldGroup from "./search-field-group.vue";
import SearchFieldInput from "./search-field-input.vue";
import SearchFieldRoot from "./search-field-root.vue";
import SearchFieldSearchIcon from "./search-field-search-icon.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldRoot as SearchField,
  SearchFieldSearchIcon,
};

export type {
  SearchFieldRootProps as SearchFieldProps,
  SearchFieldRootSlotProps as SearchFieldSlotProps,
  SearchFieldGroupProps,
  SearchFieldGroupSlotProps,
  SearchFieldInputProps,
  SearchFieldSearchIconProps,
  SearchFieldClearButtonProps,
} from "./search-field.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { provideSearchFieldContext, useSearchFieldContext } from "./search-field.context";

export type { SearchFieldContext } from "./search-field.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { searchFieldVariants } from "@ropav/styles";

export type { SearchFieldVariants } from "@ropav/styles";
