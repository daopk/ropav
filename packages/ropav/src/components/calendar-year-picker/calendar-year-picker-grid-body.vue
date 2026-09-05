<script setup lang="ts" vapor>
import type {
  CalendarYearPickerCellSlotProps,
  CalendarYearPickerGridBodyProps,
} from "./calendar-year-picker.types";

import { computed } from "vue";

import CalendarYearPickerCell from "./calendar-year-picker-cell.vue";
import { useYearPickerGridContext } from "./calendar-year-picker.context";

defineProps<CalendarYearPickerGridBodyProps>();

defineSlots<{ default?: (props: CalendarYearPickerCellSlotProps) => unknown }>();

const { focusedId, isYearPickerOpen, selectYear, years } = useYearPickerGridContext();

const entries = computed(() =>
  years.value.map(({ formatted, id, isCurrentYear, year }) => ({
    formattedYear: formatted,
    id,
    isCurrentYear,
    isOpen: isYearPickerOpen.value,
    isSelected: id === focusedId.value,
    selectYear: () => selectYear(id),
    year,
  })),
);
</script>

<template>
  <template v-for="entry in entries" :key="entry.id">
    <slot v-bind="entry">
      <CalendarYearPickerCell :id="entry.id" />
    </slot>
  </template>
</template>
