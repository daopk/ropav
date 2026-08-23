import type {Color, ColorAxes, ColorChannel, ColorSpace} from "../utils/color-types";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, shallowRef, toValue} from "vue";

import {normalizeColor, parseColor} from "../utils/color";
import {clamp, snapValueToStep} from "../utils/number";

import {useControllableState} from "./use-controllable-state";

/**
 * What a colour area with nothing to show starts from.
 *
 * White, and white is in `rgb`, so an area given no value is **red × green with blue held at its
 * maximum** — not the hue × saturation square the name "color area" suggests.
 */
const DEFAULT_COLOR = parseColor("#ffffff");

export interface UseColorAreaStateOptions {
  /** Current colour. A string is parsed. */
  value?: MaybeRefOrGetter<Color | string | undefined>;
  /** Colour used while the area is uncontrolled. @default "#ffffff" */
  defaultValue?: MaybeRefOrGetter<Color | string | undefined>;
  /**
   * The space the area works in; `xChannel` and `yChannel` have to belong to it. Defaults to the
   * space the value itself is in.
   */
  colorSpace?: MaybeRefOrGetter<ColorSpace | undefined>;
  /** Channel on the horizontal axis. Defaults to the first channel of the space. */
  xChannel?: MaybeRefOrGetter<ColorChannel | undefined>;
  /** Channel on the vertical axis. Defaults to the next channel of the space. */
  yChannel?: MaybeRefOrGetter<ColorChannel | undefined>;
  /** Called on every change, while dragging included. */
  onChange?: (value: Color) => void;
  /** Called once the interaction that changed the colour is over. */
  onChangeEnd?: (value: Color) => void;
}

export interface ColorAreaState {
  /** The colour the area holds, in the area's own colour space. */
  value: ComputedRef<Color>;
  /** The colour a form reset goes back to. */
  defaultValue: ComputedRef<Color>;
  /** Replace the whole colour. A string is parsed. */
  setValue: (value: Color | string) => void;
  /** The three channels the two axes and the held channel stand for. */
  channels: ComputedRef<ColorAxes>;
  xValue: ComputedRef<number>;
  setXValue: (value: number) => void;
  yValue: ComputedRef<number>;
  setYValue: (value: number) => void;
  /** Both channels at once, from a point given as fractions of the area's width and height. */
  setColorFromPoint: (x: number, y: number) => void;
  /** Where the thumb sits, as fractions from the area's top left corner. */
  getThumbPosition: () => {x: number; y: number};
  incrementX: (stepSize?: number) => void;
  decrementX: (stepSize?: number) => void;
  incrementY: (stepSize?: number) => void;
  decrementY: (stepSize?: number) => void;
  isDragging: ComputedRef<boolean>;
  setDragging: (value: boolean) => void;
  xChannelStep: ComputedRef<number>;
  yChannelStep: ComputedRef<number>;
  xChannelPageStep: ComputedRef<number>;
  yChannelPageStep: ComputedRef<number>;
  /** The colour the thumb is painted with: the value, made opaque. */
  getDisplayColor: () => Color;
}

/**
 * Two channels of a colour at once, driven by a point in a square.
 *
 * Ported from React Stately's `packages/react-stately/src/color/useColorAreaState.ts`
 * (react-stately 3.49.0). Unlike {@link useColorSliderState} this is **not** built on the slider
 * layer — a slider is one thumb on one axis, and nothing of its penning-in between neighbours or
 * its percentage-of-track maths carries over to a square. It borrows only `clamp` and
 * `snapValueToStep`.
 *
 * Two upstream hacks are deliberately absent rather than ported. React keeps the colour in a ref
 * beside the state so `onChangeEnd` can read the value the render has not seen yet, and keeps a
 * second ref for "was dragging" for the same reason; in Vue a write is visible to the next read in
 * the same tick, so one `shallowRef` does both jobs. What is kept is the **edge**: `onChangeEnd`
 * fires only on the true → false transition, never on a repeated `setDragging(false)`.
 *
 * @example
 * ```ts
 * const state = useColorAreaState({
 *   defaultValue: () => props.defaultValue,
 *   xChannel: () => props.xChannel,
 *   onChange: (value) => emit("change", value),
 * });
 * ```
 */
export const useColorAreaState = (options: UseColorAreaStateOptions = {}): ColorAreaState => {
  const controlledValue = computed(() => {
    const value = toValue(options.value);

    return value ? normalizeColor(value) : undefined;
  });

  const givenDefault = computed(() => {
    const value = toValue(options.defaultValue);

    if (value) return normalizeColor(value);

    // Only when nothing else can supply a colour: a controlled area is the caller's to fill.
    return toValue(options.value) ? undefined : DEFAULT_COLOR;
  });

  const {setState: setColor, state: colorValue} = useControllableState<Color>({
    // Non-null: one of the two always resolves, because a missing default falls back to white.
    defaultValue: (givenDefault.value ?? controlledValue.value)!,
    onValueChange: (value) => options.onChange?.(value),
    value: () => controlledValue.value,
  });

  /** Where a controlled area's form reset goes back to: wherever it started. */
  const initialValue = colorValue.value;

  const color = computed(() => {
    const space = toValue(options.colorSpace);

    return space ? colorValue.value.toFormat(space) : colorValue.value;
  });

  const channels = computed(() =>
    color.value.getColorSpaceAxes({
      xChannel: toValue(options.xChannel),
      yChannel: toValue(options.yChannel),
    }),
  );

  const xRange = computed(() => color.value.getChannelRange(channels.value.xChannel));
  const yRange = computed(() => color.value.getChannelRange(channels.value.yChannel));

  const xValue = computed(() => color.value.getChannelValue(channels.value.xChannel));
  const yValue = computed(() => color.value.getChannelValue(channels.value.yChannel));

  const setXValue = (value: number) => {
    if (value === xValue.value) return;

    setColor(color.value.withChannelValue(channels.value.xChannel, value));
  };

  const setYValue = (value: number) => {
    if (value === yValue.value) return;

    setColor(color.value.withChannelValue(channels.value.yChannel, value));
  };

  const isDragging = shallowRef(false);

  return {
    channels,
    decrementX: (stepSize = 1) => {
      const {maxValue, minValue, step} = xRange.value;

      setXValue(snapValueToStep(xValue.value - stepSize, minValue, maxValue, step));
    },
    decrementY: (stepSize = 1) => {
      const {maxValue, minValue, step} = yRange.value;

      setYValue(snapValueToStep(yValue.value - stepSize, minValue, maxValue, step));
    },
    defaultValue: computed(() =>
      // A controlled area has no default of its own, so it goes back to where it came in.
      controlledValue.value !== undefined ? initialValue : givenDefault.value!,
    ),
    getDisplayColor: () => color.value.withChannelValue("alpha", 1),
    getThumbPosition: () => {
      const x =
        (xValue.value - xRange.value.minValue) / (xRange.value.maxValue - xRange.value.minValue);
      // The y axis of a colour area runs upwards, and the one of the screen runs down.
      const y =
        1 -
        (yValue.value - yRange.value.minValue) / (yRange.value.maxValue - yRange.value.minValue);

      return {x, y};
    },
    // Asymmetric on purpose, and upstream is the same: stepping *up* past the maximum parks the
    // thumb on the maximum rather than snapping back down to the last whole step.
    incrementX: (stepSize = 1) => {
      const {maxValue, minValue, step} = xRange.value;
      const next = xValue.value + stepSize;

      setXValue(next > maxValue ? maxValue : snapValueToStep(next, minValue, maxValue, step));
    },
    incrementY: (stepSize = 1) => {
      const {maxValue, minValue, step} = yRange.value;
      const next = yValue.value + stepSize;

      setYValue(next > maxValue ? maxValue : snapValueToStep(next, minValue, maxValue, step));
    },
    isDragging: computed(() => isDragging.value),
    setColorFromPoint: (x, y) => {
      const {maxValue: maxX, minValue: minX, step: stepX} = xRange.value;
      const {maxValue: maxY, minValue: minY, step: stepY} = yRange.value;

      let nextX = minX + clamp(x, 0, 1) * (maxX - minX);
      let nextY = minY + (1 - clamp(y, 0, 1)) * (maxY - minY);
      let next: Color | undefined;

      if (nextX !== xValue.value) {
        nextX = snapValueToStep(nextX, minX, maxX, stepX);
        next = color.value.withChannelValue(channels.value.xChannel, nextX);
      }
      if (nextY !== yValue.value) {
        nextY = snapValueToStep(nextY, minY, maxY, stepY);
        next = (next ?? color.value).withChannelValue(channels.value.yChannel, nextY);
      }

      if (next) setColor(next);
    },
    setDragging: (dragging) => {
      const wasDragging = isDragging.value;

      isDragging.value = dragging;

      // Only the falling edge ends the interaction, so a second `setDragging(false)` — the
      // container's move handler and the pointer release both arrive — reports nothing twice.
      if (!dragging && wasDragging) options.onChangeEnd?.(color.value);
    },
    setValue: (value) => setColor(normalizeColor(value)),
    setXValue,
    setYValue,
    value: color,
    xChannelPageStep: computed(() => xRange.value.pageSize),
    xChannelStep: computed(() => xRange.value.step),
    xValue,
    yChannelPageStep: computed(() => yRange.value.pageSize),
    yChannelStep: computed(() => yRange.value.step),
    yValue,
  };
};
