import type {SliderOrientation} from "../../composables/use-slider-state";
import type {Color, ColorChannel, ColorSpace} from "../../utils/color-types";

export interface ColorSliderRootProps {
  class?: string;
  /** The channel the slider drives. */
  channel: ColorChannel;
  /**
   * The space the slider works in; `channel` has to belong to it. A combination that cannot work —
   * `channel="red"` in `hsl` — is corrected with a warning rather than left to paint nothing.
   * Defaults to the space the value itself is in.
   */
  colorSpace?: ColorSpace;
  /** Current colour. A string is parsed. */
  value?: Color | string;
  /** Colour used while the slider is uncontrolled. */
  defaultValue?: Color | string;
  /** @default "horizontal" */
  orientation?: SliderOrientation;
  isDisabled?: boolean;
  /** Id of the track, which carries the group role, and the stem the thumb id grows from. */
  id?: string;
  /** Accessible name. Without one the slider is named after its channel. */
  ariaLabel?: string;
  /** Ids of the elements that name the slider. */
  ariaLabelledby?: string;
  /** Ids of the elements that describe the slider. */
  ariaDescribedby?: string;
  /** Name submitted with the form. */
  name?: string;
  /** `id` of the form to submit with, for a slider rendered outside it. */
  form?: string;
}

export interface ColorSliderOutputProps {
  class?: string;
}

export interface ColorSliderTrackProps {
  class?: string;
}

export interface ColorSliderThumbProps {
  class?: string;
}

/** State the root and the track hand to their slots. */
export interface ColorSliderSlotProps {
  /** The colour the slider holds, in the slider's own colour space. */
  color: Color;
  orientation: SliderOrientation;
  isDisabled: boolean;
}

/** State the thumb hands to its slot. */
export interface ColorSliderThumbSlotProps {
  /** The colour the thumb is painted with, which is not always the value. */
  color: Color;
  isDragging: boolean;
  isHovered: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
}
