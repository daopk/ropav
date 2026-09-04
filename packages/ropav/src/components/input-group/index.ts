import InputGroupInput from "./input-group-input.vue";
import InputGroupPrefix from "./input-group-prefix.vue";
import InputGroupRoot from "./input-group-root.vue";
import InputGroupSuffix from "./input-group-suffix.vue";
import InputGroupTextArea from "./input-group-textarea.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  InputGroupInput,
  InputGroupPrefix,
  InputGroupRoot as InputGroup,
  InputGroupSuffix,
  InputGroupTextArea,
};

export type {
  InputGroupRootProps as InputGroupProps,
  InputGroupRootSlotProps as InputGroupSlotProps,
  InputGroupInputProps,
  InputGroupTextAreaProps,
  InputGroupPrefixProps,
  InputGroupSuffixProps,
} from "./input-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { provideInputGroupContext, useInputGroupContext } from "./input-group.context";

export type { InputGroupContext } from "./input-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { inputGroupVariants } from "@ropav/styles";

export type { InputGroupVariants } from "@ropav/styles";
