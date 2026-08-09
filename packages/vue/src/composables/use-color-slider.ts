import type {ColorSliderState} from "./use-color-slider-state";
import type {SliderGroupAttrs, SliderOutputAttrs} from "./use-slider";
import type {SliderThumbInputAttrs, UseSliderThumbReturn} from "./use-slider-thumb";
import type {Color, ColorChannel} from "../utils/color-types";
import type {CSSProperties, ComputedRef, MaybeRefOrGetter, Ref} from "vue";

import {computed, toValue} from "vue";

import {visuallyHiddenStyle} from "../utils/visually-hidden";

import {useLocale} from "./use-locale";
import {useSlider} from "./use-slider";
import {useSliderThumb} from "./use-slider-thumb";

/** Stops of the hue wheel the gradient is drawn through, in degrees. */
const HUE_STOPS = [0, 60, 120, 180, 240, 300, 360];

export interface UseColorSliderOptions {
  state: ColorSliderState;
  /** The track element. Its length is the distance the thumb can travel. */
  trackEl: Ref<HTMLElement | null>;
  /** The visually hidden range input the thumb stands for. */
  inputEl: Ref<HTMLInputElement | null>;
  /** The channel the slider drives. */
  channel: MaybeRefOrGetter<ColorChannel>;
  /** The group's own id, and the stem the thumb id grows from. */
  id: MaybeRefOrGetter<string>;
  /** Id of the visible label, when one is rendered. */
  labelId?: MaybeRefOrGetter<string | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedby?: MaybeRefOrGetter<string | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Name submitted with the form. */
  name?: MaybeRefOrGetter<string | undefined>;
  /** `id` of the form to submit with, for a slider rendered outside it. */
  form?: MaybeRefOrGetter<string | undefined>;
}

export interface UseColorSliderReturn {
  /**
   * For the **track**, not the root: this is where the group role and the accessible name live.
   * @see {@link useColorSlider}
   */
  trackAttrs: ComputedRef<SliderGroupAttrs>;
  /** Inline styles the track needs whatever the stylesheet says, gradient included. */
  trackStyle: ComputedRef<CSSProperties>;
  /**
   * Attach with `@pointerdown`, never through `v-bind`: a vapor render re-attaches every `on*`
   * key that arrived that way, which drops the listener when the press itself re-rendered it.
   */
  trackHandlers: {onPointerdown: (event: PointerEvent) => void};
  outputProps: ComputedRef<SliderOutputAttrs>;
  /** For the visually hidden range input, with the colour's name folded into its value text. */
  inputProps: ComputedRef<SliderThumbInputAttrs>;
  /** Takes the input out of sight without taking it out of the tab order. */
  inputStyle: CSSProperties;
  inputHandlers: UseSliderThumbReturn["inputHandlers"];
  /** Position along the track. Carries `backgroundColor`: the thumb shows the colour it holds. */
  thumbStyle: ComputedRef<CSSProperties>;
  thumbHandlers: UseSliderThumbReturn["thumbHandlers"];
  /** The colour the track and the thumb are painted with, which is not always the value. */
  displayColor: ComputedRef<Color>;
  isDragging: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
  /** Hand focus to the thumb, for a click on the label. */
  focusThumb: () => void;
}

/**
 * A slider over one channel of a colour: its gradient, its labelling, and its single thumb.
 *
 * Ported from React Aria's `packages/react-aria/src/color/useColorSlider.ts` (react-aria 3.51.0),
 * with the thumb's own attributes coming from the same {@link useSliderThumb} the plain slider
 * uses. Three things are particular to a colour and are the reason this exists at all:
 *
 * - **The group is the track.** Upstream merges `groupProps` into `trackProps`, so `role="group"`
 *   and the accessible name sit on `.color-slider__track` rather than on the root the way they do
 *   on a plain slider. Binding them on the root instead gives a slider two mislabelled elements
 *   and no visible sign of it.
 * - **The gradient is computed, not styled.** The track's `background` is generated from the
 *   channel — seven stops for hue, three for lightness, two for everything else — so it cannot
 *   live in the stylesheet.
 * - **The value text names the colour.** A screen reader hears `"200°, cyan blue"` rather than
 *   `"200°"`, because a number on its own says nothing about a colour.
 *
 * @example
 * ```ts
 * const slider = useColorSlider({channel: () => props.channel, id, inputEl, state, trackEl});
 * // <div v-bind="slider.trackAttrs.value" :style="slider.trackStyle.value">
 * ```
 */
export const useColorSlider = (options: UseColorSliderOptions): UseColorSliderReturn => {
  const {inputEl, state, trackEl} = options;

  const locale = useLocale();
  const channel = computed(() => toValue(options.channel));

  /**
   * A slider with nothing else naming it is named after its channel, which is what makes
   * `<ColorSlider aria-label>`-less markup announce as "Hue" rather than as an unnamed group.
   */
  const ariaLabel = computed(() => {
    const given = toValue(options.ariaLabel);

    if (given) return given;
    if (toValue(options.labelId) ?? toValue(options.ariaLabelledby)) return undefined;

    return state.value.value.getChannelName(channel.value, locale.value.locale);
  });

  const slider = useSlider({
    ariaDescribedby: () => toValue(options.ariaDescribedby),
    ariaLabel,
    ariaLabelledby: () => toValue(options.ariaLabelledby),
    id: options.id,
    labelId: options.labelId,
    state,
    trackEl,
  });

  const thumb = useSliderThumb({
    describedBy: slider.describedBy,
    form: () => toValue(options.form),
    id: () => slider.getThumbId(0),
    index: 0,
    inputEl,
    isDisabled: () => toValue(options.isDisabled),
    labelledBy: slider.labelledBy,
    name: () => toValue(options.name),
    state,
    trackEl,
  });

  const displayColor = computed(() => state.getDisplayColor());

  /**
   * The gradient runs along the track, so a vertical slider paints upwards and a horizontal one
   * in the reading direction — a right-to-left page has its minimum on the right.
   */
  const background = computed(() => {
    const color = displayColor.value;
    const to =
      state.orientation.value === "vertical"
        ? "top"
        : locale.value.direction === "ltr"
          ? "right"
          : "left";

    const min = state.getThumbMinValue(0);
    const max = state.getThumbMaxValue(0);
    const at = (value: number) => color.withChannelValue(channel.value, value).toString("css");

    switch (channel.value) {
      case "hue":
        return `linear-gradient(to ${to}, ${HUE_STOPS.map((hue) => color.withChannelValue("hue", hue).toString("css")).join(", ")})`;
      case "lightness":
        // A stop in the middle, or the hue never shows: black to white on its own is a grey ramp.
        return `linear-gradient(to ${to}, ${at(min)}, ${at((max - min) / 2)}, ${at(max)})`;
      case "saturation":
      case "brightness":
      case "red":
      case "green":
      case "blue":
      case "alpha":
        return `linear-gradient(to ${to}, ${at(min)}, ${at(max)})`;
      default:
        throw new Error("Unknown color channel: " + channel.value);
    }
  });

  /** The bare number the thumb would announce, with the colour it names appended. */
  const valueText = computed(() => {
    const text = thumb.inputProps.value["aria-valuetext"];
    const color = displayColor.value;

    if (channel.value === "hue") return `${text}, ${color.getHueName(locale.value.locale)}`;
    // Alpha says nothing about which colour it is, so nothing is appended to it.
    if (channel.value !== "alpha") return `${text}, ${color.getColorName(locale.value.locale)}`;

    return text;
  });

  return {
    displayColor,
    focusThumb: slider.focusFirstThumb,
    inputHandlers: thumb.inputHandlers,
    inputProps: computed(() => ({...thumb.inputProps.value, "aria-valuetext": valueText.value})),
    inputStyle: {
      ...visuallyHiddenStyle,
      // Filling the track rather than sitting in a 1px box: the input is what a pointer would
      // land on, and `pointer-events: none` is what lets the press through to the track while
      // keydown still bubbles up from the focused input to the thumb that handles it.
      height: "100%",
      opacity: 0.0001,
      pointerEvents: "none",
      width: "100%",
    },
    isDisabled: thumb.isDisabled,
    isDragging: thumb.isDragging,
    outputProps: slider.outputProps,
    thumbHandlers: thumb.thumbHandlers,
    thumbStyle: computed(() => ({
      ...thumb.thumbStyle.value,
      backgroundColor: displayColor.value.toString("css"),
      // Windows high contrast would otherwise repaint the one thing the thumb exists to show.
      forcedColorAdjust: "none",
    })),
    trackAttrs: slider.groupProps,
    trackHandlers: slider.trackHandlers,
    trackStyle: computed(() => ({
      ...slider.trackStyle,
      background: background.value,
      forcedColorAdjust: "none",
    })),
  };
};
