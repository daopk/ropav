import type {
  ValidationBehavior,
  ValidationFunction,
} from "../../composables/use-form-validation-state";
import type {CheckboxGroupVariants, CheckboxVariants} from "@ropav/styles";

export interface CheckboxGroupRootProps {
  class?: string;
  /** Variant the checkboxes inside take unless they name their own. @default "primary" */
  variant?: CheckboxVariants["variant"] & CheckboxGroupVariants["variant"];
  /** Selected values. Makes the group controlled. */
  value?: string[];
  /** Values selected to begin with, when the group is uncontrolled. */
  defaultValue?: string[];
  /** Disables every checkbox in the group. */
  isDisabled?: boolean;
  /** Lets the group be read but not changed. */
  isReadOnly?: boolean;
  /** Whether at least one checkbox has to be selected for the form to submit. */
  isRequired?: boolean;
  /**
   * Whether the group fails validation. Setting it either way takes the group over: `false`
   * claims it is valid and shadows `validate`, the browser and the server alike.
   */
  isInvalid?: boolean;
  /** Checks the selected values and returns a message when they are not acceptable. */
  validate?: ValidationFunction<string[]>;
  /**
   * How the group reports validation. Inherited from the surrounding form when unset.
   * @default "native"
   */
  validationBehavior?: ValidationBehavior;
  /** Name every checkbox submits under, and the key server errors arrive on. */
  name?: string;
  /** `id` of the form to submit with, for a group rendered outside it. */
  form?: string;
  /** Accessible name, for a group with no visible label. */
  ariaLabel?: string;
  /** Ids of the elements that name the group. */
  ariaLabelledby?: string;
  /** Ids of the elements that describe the group, on top of any nested help text. */
  ariaDescribedby?: string;
}

/** State the group hands to its slot, matching React's render props. */
export interface CheckboxGroupSlotProps {
  value: string[];
  isDisabled: boolean;
  isReadOnly: boolean;
  isRequired: boolean;
  isInvalid: boolean;
}
