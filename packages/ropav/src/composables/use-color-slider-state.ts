import type {Color, ColorChannel, ColorSpace} from "../utils/color-types";
import type {SliderOrientation, SliderState} from "./use-slider-state";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

import {normalizeColor, parseColor} from "../utils/color";

import {useControllableState} from "./use-controllable-state";
import {useLocale} from "./use-locale";
import {useNumberFormatter} from "./use-number-formatter";
import {useSliderState} from "./use-slider-state";

export interface UseColorSliderStateOptions {
  /** The channel the slider drives. */
  channel: MaybeRefOrGetter<ColorChannel>;
  /**
   * The space the slider works in; `channel` has to belong to it. Defaults to the space the
   * value itself is in.
   */
  colorSpace?: MaybeRefOrGetter<ColorSpace | undefined>;
  /** Current colour. A string is parsed. */
  value?: MaybeRefOrGetter<Color | string | undefined>;
  /** Colour used while the slider is uncontrolled. */
  defaultValue?: MaybeRefOrGetter<Color | string | undefined>;
  /** @default "horizontal" */
  orientation?: MaybeRefOrGetter<SliderOrientation | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Called on every change, while dragging included. */
  onChange?: (value: Color) => void;
  /** Called once the interaction that changed the colour is over. */
  onChangeEnd?: (value: Color) => void;
}

export interface ColorSliderState extends SliderState {
  /** The colour the slider currently holds, in the slider's own colour space. */
  value: ComputedRef<Color>;
  /** Replace the whole colour. A string is parsed. */
  setValue: (value: Color | string) => void;
  /**
   * The colour to *paint*, which is not always the colour held: a hue slider shows a fully
   * saturated hue whatever the value's own saturation is, and every channel but alpha paints
   * itself opaque so a translucent value does not wash the track out.
   */
  getDisplayColor: () => Color;
  isDragging: ComputedRef<boolean>;
}

/**
 * One channel of a colour, as a slider.
 *
 * Ported from React Stately's `packages/react-stately/src/color/useColorSliderState.ts`
 * (react-stately 3.49.0). Built on {@link useSliderState}: the colour is the state, and the
 * single thumb is a *controlled* view of one channel of it — every move is turned straight back
 * into `withChannelValue`, so the colour is the only thing that is ever stored.
 *
 * Two things the underlying slider gets wrong for a colour and this puts back:
 *
 * - `pageSize`. `useSliderState` derives it as a tenth of the range, which would page hue by 36°
 *   and red by 25. A colour channel carries its own: 15 for hue, 17 for r/g/b. Paging is meant to
 *   land on recognisable colours, not on round numbers.
 * - the value labels, which have to read as a colour (`"200°"`, `"50%"`) rather than as the bare
 *   number a `NumberFormatter` would give.
 *
 * Unlike upstream the locale is not an option — react-stately cannot reach one, this package can.
 *
 * @example
 * ```ts
 * const state = useColorSliderState({
 *   channel: () => props.channel,
 *   defaultValue: () => props.defaultValue,
 *   onChange: (value) => emit("change", value),
 * });
 * ```
 */
export const useColorSliderState = (options: UseColorSliderStateOptions): ColorSliderState => {
  if (toValue(options.value) == null && toValue(options.defaultValue) == null) {
    throw new Error("useColorSliderState requires a value or defaultValue");
  }

  const locale = useLocale();
  const channel = computed(() => toValue(options.channel));

  const controlledValue = computed(() => {
    const value = toValue(options.value);

    return value ? normalizeColor(value) : undefined;
  });

  const defaultValue = computed(() => {
    const value = toValue(options.defaultValue);

    return value ? normalizeColor(value) : undefined;
  });

  const {setState: setColor, state: colorValue} = useControllableState<Color>({
    // Non-null: the guard above rules out both being absent, so whichever is present lands here.
    defaultValue: (defaultValue.value ?? controlledValue.value)!,
    onValueChange: (value) => options.onChange?.(value),
    value: () => controlledValue.value,
  });

  const toSpace = (value: Color) => {
    const space = toValue(options.colorSpace);

    return space ? value.toFormat(space) : value;
  };

  const color = computed(() => toSpace(colorValue.value));

  /** Where a form reset goes back to: the caller's default, or wherever the slider started. */
  const initialValue = colorValue.value;
  const defaultColor = computed(() => toSpace(defaultValue.value ?? initialValue));

  const range = computed(() => color.value.getChannelRange(channel.value));

  // Never surfaces: both value labels are replaced below with the colour's own formatting. The
  // underlying state asks for one all the same, so it gets the locale-aware one.
  const numberFormatter = useNumberFormatter();

  const toScalar = (value: number | number[]) => (typeof value === "number" ? value : value[0]!);

  const sliderState = useSliderState({
    defaultValue: () => defaultColor.value.getChannelValue(channel.value),
    isDisabled: () => toValue(options.isDisabled),
    maxValue: () => range.value.maxValue,
    minValue: () => range.value.minValue,
    numberFormatter,
    onChange: (value) => {
      setColor(color.value.withChannelValue(channel.value, toScalar(value)));
    },
    onChangeEnd: (value) => {
      // `onChange` has already stored the value; this only marks the end of the interaction.
      options.onChangeEnd?.(color.value.withChannelValue(channel.value, toScalar(value)));
    },
    orientation: () => toValue(options.orientation),
    step: () => range.value.step,
    value: () => color.value.getChannelValue(channel.value),
  });

  const formatChannelValue = () =>
    color.value.formatChannelValue(channel.value, locale.value.locale);

  return {
    ...sliderState,
    getDisplayColor: () => {
      switch (channel.value) {
        case "hue":
          return parseColor(`hsl(${color.value.getChannelValue("hue")}, 100%, 50%)`);
        case "lightness":
        case "brightness":
        case "saturation":
        case "red":
        case "green":
        case "blue":
          return color.value.withChannelValue("alpha", 1);
        case "alpha":
          return color.value;
        default:
          throw new Error("Unknown color channel: " + channel.value);
      }
    },
    getFormattedValue: formatChannelValue,
    getThumbValueLabel: formatChannelValue,
    isDragging: computed(() => sliderState.isThumbDragging(0)),
    pageSize: computed(() => range.value.pageSize),
    setValue: (value) => setColor(normalizeColor(value)),
    value: color,
  };
};
