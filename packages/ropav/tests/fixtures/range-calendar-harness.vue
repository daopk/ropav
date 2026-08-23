<script setup lang="ts" vapor>
import type { RangeCalendarHostProps } from "./range-calendar-host.types";

import { createCalendar } from "@internationalized/date";
import { shallowRef } from "vue";

import { useRangeCalendar } from "@/composables/use-range-calendar";
import { useRangeCalendarState } from "@/composables/use-range-calendar-state";

/*
 * Every three-state boolean declares `default: undefined`: Vue casts an absent Boolean prop to
 * `false`, and a forwarded `false` is not the same as absent.
 */
const props = withDefaults(defineProps<RangeCalendarHostProps>(), {
  hasErrorMessage: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
});

const element = shallowRef<HTMLElement | null>(null);

const state = useRangeCalendarState({
  createCalendar,
  defaultFocusedValue: () => props.defaultFocusedValue,
  defaultValue: () => props.defaultValue,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  onChange: props.onChange,
  value: () => props.value,
  visibleDuration: () => props.visibleDuration,
});

const calendar = useRangeCalendar(
  {
    ariaDescribedby: () => props.ariaDescribedby,
    ariaDetails: () => props.ariaDetails,
    ariaLabel: () => props.ariaLabel,
    ariaLabelledby: () => props.ariaLabelledby,
    commitBehavior: () => props.commitBehavior,
    element,
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
  <div data-slot="range-calendar-wrapper">
    <div
      ref="element"
      data-slot="range-calendar-host"
      v-bind="calendar.attrs.value"
      @focusout="calendar.handlers.onFocusout"
    >
      <h2 data-slot="range-calendar-title">{{ calendar.title.value }}</h2>
      <button
        data-slot="range-calendar-next"
        :disabled="calendar.nextButton.isDisabled.value || undefined"
        type="button"
        v-bind="calendar.nextButton.attrs.value"
        @click="calendar.nextButton.onPress"
      />
      <div data-slot="range-calendar-cell" role="button" tabindex="0" />
    </div>
    <button data-slot="range-calendar-outside" type="button" />
  </div>
</template>
