<script setup lang="ts" vapor>
import type { CalendarHeadingHostProps } from "./calendar-heading-host.types";

import { createCalendar } from "@internationalized/date";

import { useCalendarHeading } from "@/composables/use-calendar-heading";
import { useCalendarState } from "@/composables/use-calendar-state";
import { useCalendarYearPicker } from "@/composables/use-calendar-year-picker";

const props = defineProps<CalendarHeadingHostProps>();

const state = useCalendarState({
  createCalendar,
  defaultFocusedValue: () => props.defaultFocusedValue,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  visibleDuration: () => props.visibleDuration,
});

const heading = useCalendarHeading(
  { format: () => props.format, offset: () => props.offset },
  state,
);

const years = useCalendarYearPicker(
  { format: () => props.yearFormat, visibleYears: () => props.visibleYears },
  state,
);

props.onReady?.({ heading, state, years });
</script>

<template>
  <div data-slot="calendar-heading-host">
    <h2 data-slot="calendar-heading">{{ heading }}</h2>
    <div :aria-label="years.ariaLabel.value" data-slot="calendar-year-picker" role="listbox">
      <button
        v-for="item in years.items.value"
        :key="item.id"
        :aria-selected="item.id === years.value.value"
        data-slot="calendar-year-picker-year-cell"
        :data-year="item.date.year"
        type="button"
        @click="years.onChange(item.id)"
      >
        {{ item.formatted }}
      </button>
    </div>
  </div>
</template>
