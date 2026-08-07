import type {SeparatorVariants} from "@heroui/styles";

export interface SeparatorRootProps {
  class?: string;
  /** Axis the separator divides along. @default "horizontal" */
  orientation?: SeparatorVariants["orientation"];
  /** Visual weight. @default "default" */
  variant?: SeparatorVariants["variant"];
}
