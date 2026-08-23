<script setup lang="ts" vapor>
import type { TimeFieldStateHostProps } from "./time-field-state.types";

import { useTimeFieldState } from "@/composables/use-time-field-state";

/*
 * Every three-state boolean declares `default: undefined`. Vue casts an absent Boolean prop to
 * `false`, and a forwarded `false` is not the same as absent: `isInvalid: false` pins the field as
 * controlled-valid and shadows its own range validation entirely.
 */
const props = withDefaults(defineProps<TimeFieldStateHostProps>(), {
  hideTimeZone: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  shouldForceLeadingZeros: undefined,
});

props.onReady?.(
  useTimeFieldState({
    defaultValue: () => props.defaultValue,
    granularity: () => props.granularity,
    hideTimeZone: () => props.hideTimeZone,
    hourCycle: () => props.hourCycle,
    isDisabled: () => props.isDisabled,
    isInvalid: () => props.isInvalid,
    isReadOnly: () => props.isReadOnly,
    isRequired: () => props.isRequired,
    locale: () => props.locale,
    maxValue: () => props.maxValue,
    minValue: () => props.minValue,
    name: () => props.name,
    onChange: props.onChange,
    placeholderValue: () => props.placeholderValue,
    shouldForceLeadingZeros: () => props.shouldForceLeadingZeros,
    validate: props.validate,
    validationBehavior: () => props.validationBehavior,
    value: () => props.value,
  }),
);
</script>

<template>
  <span data-slot="time-field-state-host" />
</template>
