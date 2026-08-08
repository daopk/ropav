import type {SeparatorVariants} from "@heroui/styles";

export interface SeparatorRootProps {
  class?: string;
  /**
   * Axis the separator divides along. Falls back to the cross axis of an enclosing
   * Toolbar, which is where a rule between its controls has to run. @default "horizontal"
   */
  orientation?: SeparatorVariants["orientation"];
  /** Visual weight. @default "default" */
  variant?: SeparatorVariants["variant"];
}
