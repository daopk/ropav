import type {
  ValidationBehavior,
  ValidationFunction,
} from "@/composables/use-form-validation-state";
import type { RadioGroupState } from "@/composables/use-radio-group-state";

export interface RadioGroupStateHostProps {
  /** Item values to render a radio for. */
  values?: string[];
  value?: string | null;
  defaultValue?: string | null;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  validate?: ValidationFunction<string | null>;
  validationBehavior?: ValidationBehavior;
  name?: string;
  onValueChange?: (value: string | null) => void;
  onReady?: (state: RadioGroupState) => void;
}
