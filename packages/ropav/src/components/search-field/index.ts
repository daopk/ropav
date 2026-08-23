import SearchFieldClearButton from "./search-field-clear-button.vue";
import SearchFieldGroup from "./search-field-group.vue";
import SearchFieldInput from "./search-field-input.vue";
import SearchFieldRoot from "./search-field-root.vue";
import SearchFieldSearchIcon from "./search-field-search-icon.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a search field, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const SearchField = Object.assign(SearchFieldRoot, {
  Root: SearchFieldRoot,
  Group: SearchFieldGroup,
  SearchIcon: SearchFieldSearchIcon,
  Input: SearchFieldInput,
  ClearButton: SearchFieldClearButton,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldRoot,
  SearchFieldSearchIcon,
};

export type {
  SearchFieldRootProps,
  SearchFieldRootProps as SearchFieldProps,
  SearchFieldRootSlotProps,
  SearchFieldGroupProps,
  SearchFieldGroupSlotProps,
  SearchFieldInputProps,
  SearchFieldSearchIconProps,
  SearchFieldClearButtonProps,
} from "./search-field.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {provideSearchFieldContext, useSearchFieldContext} from "./search-field.context";

export type {SearchFieldContext} from "./search-field.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {searchFieldVariants} from "@ropav/styles";

export type {SearchFieldVariants} from "@ropav/styles";
