import type {Color} from "../../utils/color-types";
import type {ColorSwatchPickerVariants} from "@ropav/styles";

export interface ColorSwatchPickerRootProps {
  /** Labels the picker. Without one — and without `ariaLabelledby` — it names itself. */
  ariaLabel?: string;
  /** Id of an element labelling the picker. */
  ariaLabelledby?: string;
  class?: string;
  /** Controlled colour. A string is parsed. */
  value?: Color | string;
  /** Colour the picker starts on while it is uncontrolled. @default "#000000" */
  defaultValue?: Color | string;
  /**
   * Whether the swatches wrap into rows or stack into a column.
   *
   * Only picks the BEM modifier: the keyboard stays two-dimensional either way, and so does
   * `data-layout`, because the React build destructures this prop out and never forwards it to
   * the collection underneath. Mirrored rather than fixed so both builds navigate alike.
   *
   * @default "grid"
   */
  layout?: ColorSwatchPickerVariants["layout"];
  /** @default "md" */
  size?: ColorSwatchPickerVariants["size"];
  /** @default "circle" */
  variant?: ColorSwatchPickerVariants["variant"];
}

export interface ColorSwatchPickerRootSlotProps {
  /** The colour currently selected. */
  color: Color;
}

export interface ColorSwatchPickerItemProps {
  class?: string;
  /** The colour this swatch stands for. A string is parsed. @default "#0000" */
  color?: Color | string;
  isDisabled?: boolean;
}

export interface ColorSwatchPickerItemSlotProps {
  /** The colour this item stands for. */
  color: Color;
  isDisabled: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isHovered: boolean;
  isPressed: boolean;
  isSelected: boolean;
}

export interface ColorSwatchPickerSwatchProps {
  /** Labels the swatch in addition to the colour's own name, which is kept. */
  ariaLabel?: string;
  /** Id of an element labelling the swatch, appended after the swatch's own id. */
  ariaLabelledby?: string;
  class?: string;
  /**
   * The colour to show. Defaults to the item's own, which is the ordinary case — a swatch inside
   * an item exists to show that item's colour.
   */
  color?: Color | string;
  /** A localized accessible name for the colour, replacing the generated one. */
  colorName?: string;
  /** Id override for the swatch element. */
  id?: string;
}

export interface ColorSwatchPickerIndicatorProps {
  class?: string;
}

export interface ColorSwatchPickerIndicatorSlotProps extends ColorSwatchPickerItemSlotProps {}
