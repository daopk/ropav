import type {ToggleGroupKey} from "../../composables/use-toggle-group-state";
import type {ToggleButtonVariants} from "@heroui/styles";

export interface ToggleButtonRootProps {
  class?: string;
  /** Selected state in uncontrolled mode. Ignored inside a group, which owns selection. */
  defaultSelected?: boolean;
  /**
   * Identifier in the group's selected keys. Required inside a ToggleButtonGroup, where
   * selection is keyed rather than per-button; unused standalone.
   */
  id?: ToggleGroupKey;
  /** Disables the button. */
  isDisabled?: boolean;
  /** Renders as a square button sized for a single icon. */
  isIconOnly?: boolean;
  /** Selected state in controlled mode. Ignored inside a group, which owns selection. */
  isSelected?: boolean;
  /** Toggle button size. */
  size?: ToggleButtonVariants["size"];
  /** Native button type. @default "button" */
  type?: "button" | "reset" | "submit";
  /** Toggle button variant. */
  variant?: ToggleButtonVariants["variant"];
}

export interface ToggleButtonSlotProps {
  isDisabled: boolean;
  isFocusVisible: boolean;
  isHovered: boolean;
  isPressed: boolean;
  isSelected: boolean;
}
