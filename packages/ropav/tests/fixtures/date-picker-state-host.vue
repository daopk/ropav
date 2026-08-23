<script setup lang="ts" vapor>
import type { DatePickerStateHostProps } from "./date-picker-state.types";

import { useDatePickerState } from "@/composables/use-date-picker-state";

/*
 * Every three-state boolean declares `default: undefined`. Vue casts an absent Boolean prop to
 * `false`, and a forwarded `false` is not the same as absent: `isInvalid: false` pins the picker as
 * controlled-valid and shadows its own bounds checking entirely.
 */
const props = withDefaults(defineProps<DatePickerStateHostProps>(), {
  hideTimeZone: undefined,
  isInvalid: undefined,
  isOpen: undefined,
  shouldCloseOnSelect: undefined,
  shouldForceLeadingZeros: undefined,
});

props.onReady?.(
  useDatePickerState({
    defaultOpen: props.defaultOpen,
    defaultValue: () => props.defaultValue,
    granularity: () => props.granularity,
    hideTimeZone: () => props.hideTimeZone,
    hourCycle: () => props.hourCycle,
    isDateUnavailable: props.isDateUnavailable,
    isInvalid: () => props.isInvalid,
    isOpen: () => props.isOpen,
    maxValue: () => props.maxValue,
    minValue: () => props.minValue,
    name: () => props.name,
    onChange: props.onChange,
    onOpenChange: props.onOpenChange,
    placeholderValue: () => props.placeholderValue,
    shouldCloseOnSelect: () => props.shouldCloseOnSelect,
    shouldForceLeadingZeros: () => props.shouldForceLeadingZeros,
    validate: props.validate,
    validationBehavior: () => props.validationBehavior,
    value: () => props.value,
  }),
);
</script>

<template>
  <span data-slot="date-picker-state-host" />
</template>
