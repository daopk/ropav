import type { SliderOrientation } from "../../composables/use-slider-state";

export interface SliderRootProps {
  class?: string;
  /** Current value. A number drives one thumb, an array one thumb per entry. */
  value?: number | number[];
  /** Value while the slider is uncontrolled. */
  defaultValue?: number | number[];
  /** @default 0 */
  minValue?: number;
  /** @default 100 */
  maxValue?: number;
  /** @default 1 */
  step?: number;
  /** @default "horizontal" */
  orientation?: SliderOrientation;
  isDisabled?: boolean;
  /** Passed to `Intl.NumberFormat` to build the value labels. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Id of the group, and the stem every thumb id grows from. */
  id?: string;
  /** Accessible name, for a slider with no visible label. */
  ariaLabel?: string;
  /** Ids of the elements that name the slider. */
  ariaLabelledby?: string;
  /** Ids of the elements that describe the slider. */
  ariaDescribedby?: string;
}

export interface SliderOutputProps {
  class?: string;
}

export interface SliderTrackProps {
  class?: string;
}

export interface SliderFillProps {
  class?: string;
}

export interface SliderThumbProps {
  class?: string;
  /** Which thumb this is, for a slider with more than one. @default 0 */
  index?: number;
  /** Disables this thumb alone. */
  isDisabled?: boolean;
  /** Name submitted with the form. */
  name?: string;
  /** `id` of the form to submit with, for a thumb rendered outside it. */
  form?: string;
}

export interface SliderMarksProps {
  class?: string;
}

/** State the root and the track hand to their slots. */
export interface SliderSlotProps {
  /** Value of every thumb, in order — iterate it to render one thumb each. */
  values: number[];
  orientation: SliderOrientation;
  isDisabled: boolean;
}

/** State the track hands to its slot. */
export interface SliderTrackSlotProps extends SliderSlotProps {
  /**
   * The value a press would set where a mouse or pen hovers over the track, snapped to the step,
   * or `null` while none hovers or the slider is disabled. For a preview of what a press would
   * do, such as a tooltip.
   */
  hoverValue: number | null;
  /**
   * Where `hoverValue` sits along the track, from 0 to 1, or `null` with it. A child of the track
   * placed at this fraction of its width (its height, from the bottom, when vertical) sits where
   * the thumb would land.
   */
  hoverPercent: number | null;
}

/** State a thumb hands to its slot. */
export interface SliderThumbSlotProps {
  isDragging: boolean;
  isHovered: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
}
