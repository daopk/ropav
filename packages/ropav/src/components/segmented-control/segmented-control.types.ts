import type { CollectionKey } from "../../composables/use-collection";
import type { SegmentedControlVariants } from "@ropav/styles";

export type SegmentedControlOrientation = "horizontal";

export interface SegmentedControlRootProps {
  class?: string;
  /**
   * The control's scale.
   *
   * The track lands on 32/36/40px, the three heights a button and a field stand at, so a
   * segmented control lines up with either.
   *
   * @default "md"
   */
  size?: SegmentedControlVariants["size"];
  /** Stretches the track across its container and shares the width between the segments. */
  fullWidth?: boolean;
  /** The selected segment, when the caller drives it. */
  selectedKey?: CollectionKey;
  /** The initially selected segment. Falls back to the first segment that is not disabled. */
  defaultSelectedKey?: CollectionKey;
  disabledKeys?: CollectionKey[];
  /** Disables every segment: a selection that stays visible but cannot be moved. */
  isDisabled?: boolean;
  /**
   * Names the control, which has no visible label of its own.
   *
   * Declared under this name because Vue normalises prop names, so a hyphenated one never
   * resolves — it is mapped back to `aria-label` at the binding.
   */
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  onSelectionChange?: (key: CollectionKey) => void;
}

export interface SegmentedControlRootSlotProps {
  selectedKey: CollectionKey | null;
  isDisabled: boolean;
}

export interface SegmentedControlItemProps {
  class?: string;
  /**
   * Identifies the segment, and is what the selection reports.
   *
   * Deliberately does not reach the DOM as an `id`, so two controls that both hold a `"weekly"`
   * segment cannot collide. It surfaces as `data-key` instead.
   */
  id: CollectionKey;
  isDisabled?: boolean;
  /** What typeahead and assistive technology read, when the rendered text will not do. */
  textValue?: string;
  /** Names the segment, for one drawn as an icon with no text beside it. */
  ariaLabel?: string;
}

export interface SegmentedControlItemSlotProps {
  isSelected: boolean;
  isDisabled: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isHovered: boolean;
  isPressed: boolean;
}

export interface SegmentedControlIndicatorProps {
  class?: string;
}

export interface SegmentedControlSeparatorProps {
  class?: string;
}
