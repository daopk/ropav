import type {ChipVariants} from "@heroui/styles";

export interface ChipRootProps {
  class?: string;
  /** Chip color. */
  color?: ChipVariants["color"];
  /**
   * Shorthand label, rendered through `Chip.Label`.
   *
   * Only used when no default slot content is passed. Pass a default slot instead when
   * the chip needs icons or any other markup alongside its label.
   */
  label?: string;
  /** Chip size. */
  size?: ChipVariants["size"];
  /** Chip variant. */
  variant?: ChipVariants["variant"];
}

export interface ChipLabelProps {
  class?: string;
}
