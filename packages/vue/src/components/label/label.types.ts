import type {LabelVariants} from "@heroui/styles";

export interface LabelRootProps {
  class?: string;
  /** Dims the label to match a disabled control. */
  isDisabled?: LabelVariants["isDisabled"];
  /** Marks the label as belonging to a control that failed validation. */
  isInvalid?: LabelVariants["isInvalid"];
  /** Renders the required marker. */
  isRequired?: LabelVariants["isRequired"];
}
