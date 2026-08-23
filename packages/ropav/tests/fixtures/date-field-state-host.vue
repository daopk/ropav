<script setup lang="ts" vapor>
import type { DateFieldStateHostProps } from "./date-field-state.types";

import { createCalendar } from "@internationalized/date";

import { useDateFieldState } from "@/composables/use-date-field-state";

/*
 * Every three-state boolean declares `default: undefined`. Vue casts an absent Boolean prop to
 * `false`, and a forwarded `false` is not the same as absent: `isInvalid: false` pins the field as
 * controlled-valid and shadows its own range validation entirely.
 */
const props = withDefaults(defineProps<DateFieldStateHostProps>(), {
  hideTimeZone: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  shouldForceLeadingZeros: undefined,
});

props.onReady?.(
  useDateFieldState({
    createCalendar: props.createCalendar ?? createCalendar,
    defaultValue: () => props.defaultValue,
    granularity: () => props.granularity,
    hideTimeZone: () => props.hideTimeZone,
    hourCycle: () => props.hourCycle,
    isDateUnavailable: props.isDateUnavailable,
    isDisabled: () => props.isDisabled,
    isInvalid: () => props.isInvalid,
    isReadOnly: () => props.isReadOnly,
    isRequired: () => props.isRequired,
    locale: () => props.locale,
    maxGranularity: () => props.maxGranularity,
    maxValue: () => props.maxValue,
    minValue: () => props.minValue,
    name: () => props.name,
    onChange: props.onChange,
    placeholderValue: () => props.placeholderValue,
    shouldForceLeadingZeros: () => props.shouldForceLeadingZeros,
    validate: props.validate,
    validationBehavior: () => props.validationBehavior,
    validationState: props.validationState,
    value: () => props.value,
  }),
);
</script>

<template>
  <span data-slot="date-field-state-host" />
</template>
