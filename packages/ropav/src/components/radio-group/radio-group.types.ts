import type {
  ValidationBehavior,
  ValidationFunction,
} from "../../composables/use-form-validation-state";
import type {RadioGroupVariants} from "@ropav/styles";

export interface RadioGroupRootProps {
  class?: string;
  /** Visual variant. @default "primary" */
  variant?: RadioGroupVariants["variant"];
  /** Layout, and the axis the arrow keys walk. @default "vertical" */
  orientation?: "horizontal" | "vertical";
  /** Selected value. Makes the group controlled. */
  value?: string | null;
  /** Value selected to begin with, when the group is uncontrolled. */
  defaultValue?: string | null;
  /** Disables every radio in the group. */
  isDisabled?: boolean;
  /** Lets the group be read but not changed. */
  isReadOnly?: boolean;
  /** Whether one of the radios has to be selected for the form to submit. */
  isRequired?: boolean;
  /**
   * Whether the group fails validation. Setting it either way takes the group over: `false`
   * claims it is valid and shadows `validate`, the browser and the server alike.
   */
  isInvalid?: boolean;
  /** Checks the selected value and returns a message when it is not acceptable. */
  validate?: ValidationFunction<string | null>;
  /**
   * How the group reports validation. Inherited from the surrounding form when unset.
   * @default "native"
   */
  validationBehavior?: ValidationBehavior;
  /** Name every radio submits under, and the key server errors arrive on. Generated if unset. */
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
export interface RadioGroupSlotProps {
  selectedValue: string | null;
  isDisabled: boolean;
  isReadOnly: boolean;
  isRequired: boolean;
  isInvalid: boolean;
}
