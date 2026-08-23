import InputGroupInput from "./input-group-input.vue";
import InputGroupPrefix from "./input-group-prefix.vue";
import InputGroupRoot from "./input-group-root.vue";
import InputGroupSuffix from "./input-group-suffix.vue";
import InputGroupTextArea from "./input-group-textarea.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of an input group, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const InputGroup = Object.assign(InputGroupRoot, {
  Root: InputGroupRoot,
  Input: InputGroupInput,
  TextArea: InputGroupTextArea,
  Prefix: InputGroupPrefix,
  Suffix: InputGroupSuffix,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {InputGroupInput, InputGroupPrefix, InputGroupRoot, InputGroupSuffix, InputGroupTextArea};

export type {
  InputGroupRootProps,
  InputGroupRootProps as InputGroupProps,
  InputGroupRootSlotProps,
  InputGroupInputProps,
  InputGroupTextAreaProps,
  InputGroupPrefixProps,
  InputGroupSuffixProps,
} from "./input-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {provideInputGroupContext, useInputGroupContext} from "./input-group.context";

export type {InputGroupContext} from "./input-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {inputGroupVariants} from "@ropav/styles";

export type {InputGroupVariants} from "@ropav/styles";
