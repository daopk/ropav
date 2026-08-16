import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

import {useNumberFormatter} from "./use-number-formatter";

export interface UseProgressValueOptions {
  formatOptions?: MaybeRefOrGetter<Intl.NumberFormatOptions | undefined>;
  isIndeterminate?: MaybeRefOrGetter<boolean | undefined>;
  maxValue?: MaybeRefOrGetter<number | undefined>;
  minValue?: MaybeRefOrGetter<number | undefined>;
  value?: MaybeRefOrGetter<number | undefined>;
  valueLabel?: MaybeRefOrGetter<string | undefined>;
}

export interface ProgressValueState {
  /** Clamped current value. */
  value: ComputedRef<number>;
  minValue: ComputedRef<number>;
  maxValue: ComputedRef<number>;
  /** Percentage in the 0–100 range, absent for indeterminate progress. */
  percentage: ComputedRef<number | undefined>;
  /** Localized value exposed to assistive technology and output parts. */
  valueText: ComputedRef<string | undefined>;
  isIndeterminate: ComputedRef<boolean>;
}

/** Shared value, percentage and formatting semantics for Meter and both Progress components. */
export const useProgressValue = (options: UseProgressValueOptions): ProgressValueState => {
  // React Aria defaults to percent only when the whole options object is absent. Passing an
  // object without `style` intentionally falls back to Intl's decimal style and formats the raw
  // value rather than the percentage.
  const formatOptions = computed(
    () => toValue(options.formatOptions) ?? ({style: "percent"} as Intl.NumberFormatOptions),
  );
  const formatter = useNumberFormatter(formatOptions);

  const minValue = computed(() => toValue(options.minValue) ?? 0);
  const maxValue = computed(() => toValue(options.maxValue) ?? 100);
  const value = computed(() => {
    const current = toValue(options.value) ?? 0;

    return Math.min(Math.max(current, minValue.value), maxValue.value);
  });
  const determinatePercentage = computed(() => {
    const range = maxValue.value - minValue.value;

    return range === 0 ? 0 : ((value.value - minValue.value) / range) * 100;
  });
  const isIndeterminate = computed(() => Boolean(toValue(options.isIndeterminate)));
  const percentage = computed(() =>
    isIndeterminate.value ? undefined : determinatePercentage.value,
  );
  const valueText = computed(() => {
    if (isIndeterminate.value) return undefined;

    const explicit = toValue(options.valueLabel);

    if (explicit) return explicit;

    const valueToFormat =
      formatOptions.value.style === "percent" ? determinatePercentage.value / 100 : value.value;

    return formatter.value.format(valueToFormat);
  });

  return {isIndeterminate, maxValue, minValue, percentage, value, valueText};
};
