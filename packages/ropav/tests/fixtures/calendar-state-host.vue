<script setup lang="ts" vapor>
import type { CalendarStateHostProps } from "./calendar-state.types";

import { createCalendar } from "@internationalized/date";

import { useCalendarState } from "@/composables/use-calendar-state";

/*
 * Every three-state boolean declares `default: undefined`. Vue casts an absent Boolean prop to
 * `false`, and a forwarded `false` is not the same as absent: `isInvalid: false` pins the calendar
 * as controlled-valid and shadows the unavailable-date check entirely.
 */
const props = withDefaults(defineProps<CalendarStateHostProps>(), {
  autoFocus: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
});

props.onReady?.(
  useCalendarState({
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
    selectionMode: () => props.selectionMode,
    value: () => props.value,
    visibleDuration: () => props.visibleDuration,
    weeksInMonth: () => props.weeksInMonth,
  }),
);
</script>

<template>
  <span data-slot="calendar-state-host" />
</template>
