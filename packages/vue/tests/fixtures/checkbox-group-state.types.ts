import type {CheckboxGroupState, ValidationBehavior, ValidationFunction} from "@/composables";

export interface CheckboxGroupStateHostProps {
  /** Item values to render an input for. */
  values?: string[];
  value?: string[];
  defaultValue?: string[];
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  validate?: ValidationFunction<string[]>;
  validationBehavior?: ValidationBehavior;
  name?: string;
  /** Values whose input is rendered disabled, to prove the scan skips them. */
  disabledValues?: string[];
  onValueChange?: (value: string[]) => void;
  onReady?: (state: CheckboxGroupState) => void;
}
