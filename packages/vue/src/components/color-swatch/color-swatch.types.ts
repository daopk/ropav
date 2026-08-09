import type {Color} from "../../utils/color-types";
import type {ColorSwatchVariants} from "@heroui/styles";

export interface ColorSwatchRootProps {
  /** Labels the swatch in addition to the colour's own name, which is kept. */
  ariaLabel?: string;
  /** Id of an element labelling the swatch, appended after the swatch's own id. */
  ariaLabelledby?: string;
  class?: string;
  /**
   * The colour to show. A string is parsed. Absent means a fully transparent swatch, which is
   * announced as "transparent" rather than by hue. @default "#fff0"
   */
  color?: Color | string;
  /**
   * A localized accessible name for the colour, replacing the generated one. For a colour that
   * has a name of its own — a Pantone number, a brand colour — that a hue description cannot give.
   */
  colorName?: string;
  /** Id override for the swatch element. */
  id?: string;
  /** @default "circle" */
  shape?: ColorSwatchVariants["shape"];
  /** @default "md" */
  size?: ColorSwatchVariants["size"];
}

export interface ColorSwatchSlotProps {
  /** The parsed colour the swatch is showing. */
  color: Color;
}
