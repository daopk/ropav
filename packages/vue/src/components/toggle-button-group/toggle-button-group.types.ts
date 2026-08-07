import type {
  ToggleGroupKey,
  ToggleGroupSelectionMode,
} from "../../composables/use-toggle-group-state";
import type {ToggleButtonVariants} from "@heroui/styles";

export interface ToggleButtonGroupRootProps {
  class?: string;
  /** Selected keys in uncontrolled mode. */
  defaultSelectedKeys?: Iterable<ToggleGroupKey>;
  /** Keeps at least one key selected, so the group can never be turned fully off. */
  disallowEmptySelection?: boolean;
  /** Stretches the group to the full width of its container. */
  fullWidth?: boolean;
  /** Separates the buttons visually instead of joining them into one control. */
  isDetached?: boolean;
  /** Disables every button in the group. */
  isDisabled?: boolean;
  /** Direction the buttons are laid out in. @default "horizontal" */
  orientation?: "horizontal" | "vertical";
  /** Selected keys in controlled mode. */
  selectedKeys?: Iterable<ToggleGroupKey>;
  /** Whether one or many buttons can be selected at a time. @default "single" */
  selectionMode?: ToggleGroupSelectionMode;
  /** Size for every button in the group. Each button can still set its own. */
  size?: ToggleButtonVariants["size"];
}

export interface ToggleButtonGroupSeparatorProps {
  class?: string;
}
