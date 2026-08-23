<script setup lang="ts" vapor>
import type {
  CalendarYearPickerCellSlotProps,
  CalendarYearPickerGridBodyProps,
} from "./calendar-year-picker.types";

import {computed} from "vue";

import CalendarYearPickerCell from "./calendar-year-picker-cell.vue";
import {useYearPickerGridContext} from "./calendar-year-picker.context";

defineProps<CalendarYearPickerGridBodyProps>();

defineSlots<{default?: (props: CalendarYearPickerCellSlotProps) => unknown}>();

const {focusedYear, getFormattedYear, isYearPickerOpen, selectYear, years} =
  useYearPickerGridContext();

/** The current Gregorian year, for marking "this year" whatever calendar is on screen. */
const currentYear = new Date().getFullYear();

const entries = computed(() =>
  years.value.map((year) => ({
    formattedYear: getFormattedYear(year),
    isCurrentYear: year === currentYear,
    isOpen: isYearPickerOpen.value,
    isSelected: year === focusedYear.value,
    selectYear: () => selectYear(year),
    year,
  })),
);
</script>

<template>
  <template v-for="entry in entries" :key="entry.year">
    <slot v-bind="entry">
      <CalendarYearPickerCell :year="entry.year" />
    </slot>
  </template>
</template>
