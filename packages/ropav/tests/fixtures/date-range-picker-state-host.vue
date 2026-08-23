<script setup lang="ts" vapor>
import type { DateRangePickerStateHostProps } from "./date-range-picker-state.types";

import { useDateRangePickerState } from "@/composables/use-date-range-picker-state";

/*
 * Every three-state boolean declares `default: undefined`. Vue casts an absent Boolean prop to
 * `false`, and a forwarded `false` is not the same as absent: `isInvalid: false` pins the picker as
 * controlled-valid and shadows its own bounds checking entirely.
 */
const props = withDefaults(defineProps<DateRangePickerStateHostProps>(), {
  hideTimeZone: undefined,
  isInvalid: undefined,
  isOpen: undefined,
  shouldCloseOnSelect: undefined,
  shouldForceLeadingZeros: undefined,
});

props.onReady?.(
  useDateRangePickerState({
    defaultOpen: props.defaultOpen,
    defaultValue: () => props.defaultValue,
    endName: () => props.endName,
    granularity: () => props.granularity,
    hideTimeZone: () => props.hideTimeZone,
    hourCycle: () => props.hourCycle,
    isDateUnavailable: props.isDateUnavailable,
    isInvalid: () => props.isInvalid,
    isOpen: () => props.isOpen,
    maxValue: () => props.maxValue,
    minValue: () => props.minValue,
    onChange: props.onChange,
    onOpenChange: props.onOpenChange,
    placeholderValue: () => props.placeholderValue,
    shouldCloseOnSelect: () => props.shouldCloseOnSelect,
    shouldForceLeadingZeros: () => props.shouldForceLeadingZeros,
    startName: () => props.startName,
    validate: props.validate,
    validationBehavior: () => props.validationBehavior,
    value: () => props.value,
  }),
);
</script>

<template>
  <span data-slot="date-range-picker-state-host" />
</template>
