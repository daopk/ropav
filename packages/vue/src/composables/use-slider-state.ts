import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, shallowRef, toValue} from "vue";

import {clamp, snapValueToStep} from "../utils/number";

import {useControllableState} from "./use-controllable-state";

export type SliderOrientation = "horizontal" | "vertical";

const DEFAULT_MIN_VALUE = 0;
const DEFAULT_MAX_VALUE = 100;
const DEFAULT_STEP_VALUE = 1;

export interface UseSliderStateOptions {
  /** Current value. A single number drives one thumb, an array one thumb per entry. */
  value?: MaybeRefOrGetter<number | number[] | undefined>;
  /** Value used while the slider is uncontrolled. */
  defaultValue?: MaybeRefOrGetter<number | number[] | undefined>;
  /** @default 0 */
  minValue?: MaybeRefOrGetter<number | undefined>;
  /** @default 100 */
  maxValue?: MaybeRefOrGetter<number | undefined>;
  /** @default 1 */
  step?: MaybeRefOrGetter<number | undefined>;
  /** @default "horizontal" */
  orientation?: MaybeRefOrGetter<SliderOrientation | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Formats the value labels. */
  numberFormatter: MaybeRefOrGetter<Intl.NumberFormat>;
  /** Called on every change, while dragging included. */
  onChange?: (value: number | number[]) => void;
  /** Called once the interaction that changed the value is over. */
  onChangeEnd?: (value: number | number[]) => void;
}

export interface SliderState {
  /** Value of every thumb, by index. */
  values: ComputedRef<number[]>;
  /** Value every thumb goes back to when the surrounding form is reset. */
  defaultValues: ComputedRef<number[]>;
  step: ComputedRef<number>;
  /** How far a paging key moves a thumb. */
  pageSize: ComputedRef<number>;
  orientation: ComputedRef<SliderOrientation>;
  isDisabled: ComputedRef<boolean>;
  /** Index of the thumb that holds focus, if any. */
  focusedThumb: ComputedRef<number | undefined>;
  getThumbValue: (index: number) => number;
  /** Clamped between the neighbouring thumbs and snapped to the step. */
  setThumbValue: (index: number, value: number) => void;
  /** `percent` runs from 0 to 1 along the track. */
  setThumbPercent: (index: number, percent: number) => void;
  isThumbDragging: (index: number) => boolean;
  setThumbDragging: (index: number, isDragging: boolean) => void;
  setFocusedThumb: (index: number | undefined) => void;
  getThumbPercent: (index: number) => number;
  getValuePercent: (value: number) => number;
  getThumbValueLabel: (index: number) => string;
  getFormattedValue: (value?: number | number[]) => string;
  getThumbMinValue: (index: number) => number;
  getThumbMaxValue: (index: number) => number;
  getPercentValue: (percent: number) => number;
  isThumbEditable: (index: number) => boolean;
  setThumbEditable: (index: number, isEditable: boolean) => void;
  incrementThumb: (index: number, stepSize?: number) => void;
  decrementThumb: (index: number, stepSize?: number) => void;
}

const convertValue = (value?: number | number[]): number[] | undefined => {
  if (value == null) return undefined;

  return Array.isArray(value) ? value : [value];
};

/** Replace one entry, keeping the same array when the value has not moved. */
const replaceIndex = <T>(values: T[], index: number, value: T): T[] => {
  if (values[index] === value) return values;

  return [...values.slice(0, index), value, ...values.slice(index + 1)];
};

/**
 * Values, dragging and focus for a slider with any number of thumbs.
 *
 * Ported from React Stately's `useSliderState`. Values are held as an array whatever the
 * caller passed, and handed back in the shape they came in — a caller who set a single number
 * gets a single number.
 *
 * Every thumb is penned in by its neighbours: thumb `n` can go no lower than thumb `n - 1`
 * and no higher than thumb `n + 1`, which is what keeps a range from turning inside out.
 *
 * @example
 * ```ts
 * const state = useSliderState({
 *   defaultValue: () => props.defaultValue,
 *   numberFormatter: formatter,
 *   onChange: (value) => emit("change", value),
 * });
 * ```
 */
export const useSliderState = (options: UseSliderStateOptions): SliderState => {
  const minValue = computed(() => toValue(options.minValue) ?? DEFAULT_MIN_VALUE);
  const maxValue = computed(() => toValue(options.maxValue) ?? DEFAULT_MAX_VALUE);
  const step = computed(() => toValue(options.step) ?? DEFAULT_STEP_VALUE);
  const orientation = computed<SliderOrientation>(
    () => toValue(options.orientation) ?? "horizontal",
  );
  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));

  // A page is a tenth of the range, rounded to a whole number of steps and never smaller
  // than one step — otherwise paging on a coarse slider would not move at all.
  const pageSize = computed(() => {
    const range = (maxValue.value - minValue.value) / 10;

    return Math.max(snapValueToStep(range, 0, range + step.value, step.value), step.value);
  });

  /** Snap each value to the step and pen it in between the thumbs either side of it. */
  const restrictValues = (values: number[] | undefined) =>
    values?.map((value, index) => {
      const min = index === 0 ? minValue.value : values[index - 1]!;
      const max = index === values.length - 1 ? maxValue.value : values[index + 1]!;

      return snapValueToStep(value, min, max, step.value);
    });

  const controlledValue = computed(() => restrictValues(convertValue(toValue(options.value))));
  const defaultValue = computed(
    () => restrictValues(convertValue(toValue(options.defaultValue))) ?? [minValue.value],
  );

  /**
   * A caller who passed a single number gets a single number back, however many thumbs the
   * state happens to hold.
   */
  const toCallerShape = (values: number[]): number | number[] => {
    const isScalar =
      typeof toValue(options.value) === "number" ||
      typeof toValue(options.defaultValue) === "number";

    return isScalar ? values[0]! : values;
  };

  const {setState, state: values} = useControllableState<number[]>({
    defaultValue: defaultValue.value,
    onValueChange: (next) => options.onChange?.(toCallerShape(next)),
    value: () => controlledValue.value,
  });

  /** What a form reset goes back to: the caller's default, or wherever the slider started. */
  const initialValues = values.value;

  const isDraggings = shallowRef<boolean[]>(new Array(values.value.length).fill(false));
  const focusedThumb = shallowRef<number | undefined>(undefined);
  // Editability is read while handling an event and never rendered, so it stays off the
  // reactivity graph, exactly as React holds it in a ref.
  const isEditables: boolean[] = new Array(values.value.length).fill(true);

  const getValuePercent = (value: number) =>
    (value - minValue.value) / (maxValue.value - minValue.value);

  const getThumbMinValue = (index: number) =>
    index === 0 ? minValue.value : values.value[index - 1]!;

  const getThumbMaxValue = (index: number) =>
    index === values.value.length - 1 ? maxValue.value : values.value[index + 1]!;

  const isThumbEditable = (index: number) => isEditables[index] ?? true;

  const setThumbEditable = (index: number, isEditable: boolean) => {
    isEditables[index] = isEditable;
  };

  const setThumbValue = (index: number, value: number) => {
    if (isDisabled.value || !isThumbEditable(index)) return;

    setState(
      replaceIndex(
        values.value,
        index,
        snapValueToStep(value, getThumbMinValue(index), getThumbMaxValue(index), step.value),
      ),
    );
  };

  const setThumbDragging = (index: number, isDragging: boolean) => {
    if (isDisabled.value || !isThumbEditable(index)) return;

    const wasDragging = isDraggings.value[index];

    isDraggings.value = replaceIndex(isDraggings.value, index, isDragging);

    // The interaction is over only once nothing is being dragged any more, so a two-thumb
    // slider reports one end rather than one per thumb.
    if (wasDragging && !isDraggings.value.some(Boolean)) {
      options.onChangeEnd?.(toCallerShape(values.value));
    }
  };

  const getRoundedValue = (value: number) =>
    Math.round((value - minValue.value) / step.value) * step.value + minValue.value;

  const getPercentValue = (percent: number) => {
    const value = percent * (maxValue.value - minValue.value) + minValue.value;

    return clamp(getRoundedValue(value), minValue.value, maxValue.value);
  };

  const getFormattedValue = (value: number | number[] = values.value) => {
    const formatter = toValue(options.numberFormatter);
    const parts = typeof value === "number" ? [value] : value;

    if (parts.length === 0) return "";
    if (parts.length === 1) return formatter.format(parts[0]!);
    if (parts.length === 2) return formatter.formatRange(parts[0]!, parts[1]!);

    return new Intl.ListFormat(formatter.resolvedOptions().locale, {type: "unit"}).format(
      parts.map((part) => formatter.format(part)),
    );
  };

  return {
    decrementThumb: (index, stepSize = 1) =>
      setThumbValue(
        index,
        snapValueToStep(
          values.value[index]! - Math.max(stepSize, step.value),
          minValue.value,
          maxValue.value,
          step.value,
        ),
      ),
    defaultValues: computed(() =>
      toValue(options.defaultValue) !== undefined ? defaultValue.value : initialValues,
    ),
    focusedThumb: computed(() => focusedThumb.value),
    getFormattedValue,
    getPercentValue,
    getThumbMaxValue,
    getThumbMinValue,
    getThumbPercent: (index) => getValuePercent(values.value[index]!),
    getThumbValue: (index) => values.value[index]!,
    getThumbValueLabel: (index) => getFormattedValue(values.value[index]),
    getValuePercent,
    incrementThumb: (index, stepSize = 1) =>
      setThumbValue(
        index,
        snapValueToStep(
          values.value[index]! + Math.max(stepSize, step.value),
          minValue.value,
          maxValue.value,
          step.value,
        ),
      ),
    isDisabled,
    isThumbDragging: (index) => Boolean(isDraggings.value[index]),
    isThumbEditable,
    orientation,
    pageSize,
    setFocusedThumb: (index) => {
      focusedThumb.value = index;
    },
    setThumbDragging,
    setThumbEditable,
    setThumbPercent: (index, percent) => setThumbValue(index, getPercentValue(percent)),
    setThumbValue,
    step,
    values: computed(() => values.value),
  };
};
