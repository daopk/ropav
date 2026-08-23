<script setup lang="ts" vapor>
import type { CalendarHostProps } from "./calendar-host.types";

import { createCalendar } from "@internationalized/date";

import { useCalendar } from "@/composables/use-calendar";
import { useCalendarState } from "@/composables/use-calendar-state";

/*
 * Every three-state boolean declares `default: undefined`: Vue casts an absent Boolean prop to
 * `false`, and a forwarded `false` is not the same as absent.
 */
const props = withDefaults(defineProps<CalendarHostProps>(), {
  hasErrorMessage: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
});

const state = useCalendarState({
  createCalendar,
  defaultFocusedValue: () => props.defaultFocusedValue,
  defaultValue: () => props.defaultValue,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  selectionMode: () => props.selectionMode,
  value: () => props.value,
  visibleDuration: () => props.visibleDuration,
});

const calendar = useCalendar(
  {
    ariaDescribedby: () => props.ariaDescribedby,
    ariaDetails: () => props.ariaDetails,
    ariaLabel: () => props.ariaLabel,
    ariaLabelledby: () => props.ariaLabelledby,
    hasErrorMessage: () => props.hasErrorMessage,
    id: () => props.id,
    isDisabled: () => props.isDisabled,
    isInvalid: () => props.isInvalid,
  },
  state,
);

props.onReady?.({ calendar, state });
</script>

<template>
  <div data-slot="calendar-host" v-bind="calendar.attrs.value">
    <h2 data-slot="calendar-title">{{ calendar.title.value }}</h2>
    <button
      data-slot="calendar-previous"
      :disabled="calendar.prevButton.isDisabled.value || undefined"
      type="button"
      v-bind="calendar.prevButton.attrs.value"
      @blur="calendar.prevButton.onFocusChange(false)"
      @click="calendar.prevButton.onPress"
      @focus="calendar.prevButton.onFocusChange(true)"
    />
    <button
      data-slot="calendar-next"
      :disabled="calendar.nextButton.isDisabled.value || undefined"
      type="button"
      v-bind="calendar.nextButton.attrs.value"
      @blur="calendar.nextButton.onFocusChange(false)"
      @click="calendar.nextButton.onPress"
      @focus="calendar.nextButton.onFocusChange(true)"
    />
    <span v-if="props.hasErrorMessage" :id="calendar.errorMessageProps.value.id">Out of range</span>
  </div>
</template>
