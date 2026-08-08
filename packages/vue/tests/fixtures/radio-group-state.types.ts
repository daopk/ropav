import type {RadioGroupState, ValidationBehavior, ValidationFunction} from "@/composables";

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
