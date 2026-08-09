<script setup lang="ts" vapor>
import type {RangeCalendarStateHostProps} from "./range-calendar-state.types";

import {createCalendar} from "@internationalized/date";

import {useRangeCalendarState} from "@/composables/use-range-calendar-state";

/*
 * Every three-state boolean declares `default: undefined`. Vue casts an absent Boolean prop to
 * `false`, and a forwarded `false` is not the same as absent: `isInvalid: false` pins the calendar
 * as controlled-valid and shadows its own range validation entirely.
 */
const props = withDefaults(defineProps<RangeCalendarStateHostProps>(), {
  allowsNonContiguousRanges: undefined,
  autoFocus: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
});

props.onReady?.(
  useRangeCalendarState({
    allowsNonContiguousRanges: () => props.allowsNonContiguousRanges,
    autoFocus: () => props.autoFocus,
    createCalendar,
    defaultFocusedValue: () => props.defaultFocusedValue,
    defaultValue: () => props.defaultValue,
    firstDayOfWeek: () => props.firstDayOfWeek,
    focusedValue: () => props.focusedValue,
    isDateUnavailable: props.isDateUnavailable,
    isDisabled: () => props.isDisabled,
    isInvalid: () => props.isInvalid,
    isReadOnly: () => props.isReadOnly,
    locale: () => props.locale,
    maxValue: () => props.maxValue,
    minValue: () => props.minValue,
    onChange: props.onChange,
    onFocusChange: props.onFocusChange,
    pageBehavior: () => props.pageBehavior,
    selectionAlignment: () => props.selectionAlignment,
    value: () => props.value,
    visibleDuration: () => props.visibleDuration,
    weeksInMonth: () => props.weeksInMonth,
  }),
);
</script>

<template>
  <span data-slot="range-calendar-state-host" />
</template>
