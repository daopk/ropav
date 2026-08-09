import type {ValidationBehavior} from "./use-form-validation-state";
import type {NumberFieldState} from "./use-number-field-state";
import type {Color, ColorChannel, ColorSpace} from "../utils/color-types";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

import {parseColor} from "../utils/color";

import {parseColorValue} from "./use-color-field-state";
import {useControllableState} from "./use-controllable-state";
import {useNumberFieldState} from "./use-number-field-state";

export interface UseColorChannelFieldStateOptions {
  /** The channel the field edits. */
  channel: MaybeRefOrGetter<ColorChannel>;
  /**
   * The space the field works in; `channel` has to belong to it. Defaults to the space the value
   * itself is in.
   */
  colorSpace?: MaybeRefOrGetter<ColorSpace | undefined>;
  /** Controlled colour. A string is parsed; one that will not parse is treated as absent. */
  value?: MaybeRefOrGetter<Color | string | null | undefined>;
  /** Colour the field starts with, and goes back to when the form is reset. */
  defaultValue?: MaybeRefOrGetter<Color | string | null | undefined>;
  onChange?: (value: Color | null) => void;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  /** Locale the number is written and read in. @default the runtime's own */
  locale?: MaybeRefOrGetter<string | undefined>;
  /**
   * Whether the browser blocks the submit or the field merely announces the requirement.
   *
   * Not one of upstream's state options, but it has to be here: the number field resolves it
   * from its state, so a state built outside would otherwise pin the field to the default and
   * `validationBehavior="aria"` would silently do nothing.
   */
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
}

export interface ColorChannelFieldState extends NumberFieldState {
  /** The colour the field edits, in the field's own colour space. */
  colorValue: ComputedRef<Color>;
  /** What a form reset goes back to. `null` when the field started empty. */
  defaultColorValue: ComputedRef<Color | null>;
  setColorValue: (value: Color | null) => void;
  /** How the channel is written, which the behaviour layer needs for the announcement. */
  formatOptions: ComputedRef<Intl.NumberFormatOptions>;
}

/**
 * Stand-in for an absent colour, so a channel still has something to read.
 *
 * An empty field shows nothing, but the *range* of its channel still has to come from somewhere —
 * and black is the colour whose every channel sits at its minimum.
 */
const BLACK = parseColor("#000");

/**
 * State for a colour channel field, ported from React Stately's
 * `packages/react-stately/src/color/useColorChannelFieldState.ts` (react-stately 3.49.0).
 *
 * Built on {@link useNumberFieldState}, and the number it holds is a *view* of one channel of the
 * colour rather than a value of its own: the state is always in controlled mode, so every edit
 * goes straight back through `withChannelValue` and the colour stays the only thing stored.
 *
 * The `multiplier` is the part worth reading twice. A channel written as a percent whose range
 * runs 0–100 is edited as 0–1 and formatted back up, because `Intl` multiplies a percent by a
 * hundred itself — without it a saturation of 100 would come out as `10,000%`. Alpha already runs
 * 0–1, so it keeps a multiplier of one.
 *
 * @example
 * ```ts
 * const state = useColorChannelFieldState({channel: () => props.channel, value: () => props.value});
 * ```
 */
export const useColorChannelFieldState = (
  options: UseColorChannelFieldStateOptions,
): ColorChannelFieldState => {
  const channel = computed(() => toValue(options.channel));
  const colorSpace = computed(() => toValue(options.colorSpace));

  const controlledValue = computed(() => parseColorValue(toValue(options.value)));
  const defaultValue = computed(() => parseColorValue(toValue(options.defaultValue)));

  const {setState: setColorValue, state: colorValue} = useControllableState<Color | null>({
    defaultValue: defaultValue.value ?? null,
    onValueChange: (value) => options.onChange?.(value),
    value: () => controlledValue.value,
  });

  const convert = (value: Color | null) => {
    const nonNull = value ?? BLACK;

    return colorSpace.value ? nonNull.toFormat(colorSpace.value) : nonNull;
  };

  const color = computed(() => convert(colorValue.value));

  /** Captured once: a form reset goes back to where the field started, not to where it is now. */
  const initialValue = colorValue.value;
  const defaultColorValue = computed(() => defaultValue.value ?? initialValue);
  const defaultColor = computed(() => convert(defaultColorValue.value));

  const range = computed(() => color.value.getChannelRange(channel.value));
  const formatOptions = computed(() => color.value.getChannelFormatOptions(channel.value));
  const multiplier = computed(() =>
    formatOptions.value.style === "percent" && range.value.maxValue === 100 ? 100 : 1,
  );

  const state = useNumberFieldState({
    defaultValue: () =>
      defaultColorValue.value === null
        ? Number.NaN
        : defaultColor.value.getChannelValue(channel.value) / multiplier.value,
    formatOptions,
    isDisabled: () => toValue(options.isDisabled),
    isReadOnly: () => toValue(options.isReadOnly),
    locale: () => toValue(options.locale),
    maxValue: () => range.value.maxValue / multiplier.value,
    minValue: () => range.value.minValue / multiplier.value,
    onChange: (value) => {
      if (Number.isNaN(value)) setColorValue(null);
      else setColorValue(color.value.withChannelValue(channel.value, value * multiplier.value));
    },
    step: () => range.value.step / multiplier.value,
    validationBehavior: () => toValue(options.validationBehavior),
    // Always present, which keeps the number field permanently controlled by the colour.
    value: () =>
      colorValue.value === null
        ? Number.NaN
        : color.value.getChannelValue(channel.value) / multiplier.value,
  });

  return {
    ...state,
    colorValue: color,
    defaultColorValue,
    formatOptions,
    setColorValue,
  };
};
