import type {Color, ColorChannel, ColorSpace} from "../../utils/color-types";

export interface ColorAreaRootProps {
  class?: string;
  /** Current colour. A string is parsed. */
  value?: Color | string;
  /**
   * Colour used while the area is uncontrolled. Absent means white — which is an `rgb` colour, so
   * an area with no value at all is red × green rather than the hue square the name suggests.
   */
  defaultValue?: Color | string;
  /**
   * The space the area works in; `xChannel` and `yChannel` have to belong to it. Defaults to the
   * space the value itself is in.
   */
  colorSpace?: ColorSpace;
  /** Channel on the horizontal axis. Defaults to the first channel of the space. */
  xChannel?: ColorChannel;
  /** Channel on the vertical axis. Defaults to the next channel of the space. */
  yChannel?: ColorChannel;
  isDisabled?: boolean;
  /** Id of the area, and the stem both hidden inputs' ids grow from. */
  id?: string;
  /** Accessible name. The words "color picker" are appended to it. */
  ariaLabel?: string;
  /** Ids of the elements that name the area. */
  ariaLabelledby?: string;
  /** Ids of the elements that describe the area. */
  ariaDescribedby?: string;
  /** Name the horizontal channel is submitted under. */
  xName?: string;
  /** Name the vertical channel is submitted under. */
  yName?: string;
  /** `id` of the form to submit with, for an area rendered outside it. */
  form?: string;
  /**
   * Overlays a dot pattern, purely decorative. @default false
   *
   * Declared as a plain `boolean` rather than as `ColorAreaVariants["showDots"]`: Vue's compiler
   * only casts a bare `show-dots` attribute to `true` for a prop it can see is Boolean, and an
   * indexed access into an imported type is not something it can resolve. Written the other way
   * the attribute arrives as `""`, which no variant matches, and the dots silently never appear.
   */
  showDots?: boolean;
}

export interface ColorAreaThumbProps {
  class?: string;
}

/** State the root hands to its slot. */
export interface ColorAreaSlotProps {
  /** The colour the area holds, in the area's own colour space. */
  color: Color;
  isDisabled: boolean;
}

/** State the thumb hands to its slot. */
export interface ColorAreaThumbSlotProps {
  /** The colour the thumb is painted with: the value, made opaque. */
  color: Color;
  isDragging: boolean;
  isHovered: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
}
