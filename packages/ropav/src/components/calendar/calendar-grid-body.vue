<script setup lang="ts" vapor>
import type { CalendarGridBodyProps, CalendarGridBodySlotProps } from "./calendar.types";
import type { CalendarDate } from "@internationalized/date";

import { computed } from "vue";

import { useLocale } from "../../composables/use-locale";
import { getDayViewGridRows } from "../../utils/calendar";

import {
  useCalendarContext,
  useCalendarGridContext,
  useCalendarStateContext,
} from "./calendar.context";

const props = defineProps<CalendarGridBodyProps>();

defineSlots<{ default?: (props: CalendarGridBodySlotProps) => unknown }>();

const { dayView, slots } = useCalendarContext();
const { startDate, weeksInMonth } = useCalendarGridContext();
const { state } = useCalendarStateContext();
const locale = useLocale();

const styles = computed(() => slots.value.gridBody({ class: props.class }));

/**
 * A day view spanning a week or more lays its own rows out.
 *
 * The state's week rows are month-shaped: they start on the calendar's own start and run to the end
 * of the month. A day view has to start on a week boundary and stop at its last visible day.
 *
 * React reaches this branch on `dayView.days >= 7 && typeof children === "function"`. A Vue slot is
 * always a function, so the condition is just the day count — nothing is lost, because both
 * branches render one cell per date.
 */
const isCustomDayView = computed(() => Boolean(dayView.value && dayView.value.days >= 7));

const rows = computed<(CalendarDate | null)[][]>(() => {
  const view = dayView.value;

  if (isCustomDayView.value && view) {
    return getDayViewGridRows(
      view.visibleRange.start,
      view.visibleRange.end,
      locale.value.locale,
      view.firstDayOfWeek,
    ) as (CalendarDate | null)[][];
  }

  return Array.from({ length: weeksInMonth.value }, (_, week) =>
    state.getDatesInWeek(week, startDate.value),
  );
});
</script>

<template>
  <tbody :class="styles" data-slot="calendar-grid-body">
    <tr v-for="(row, week) in rows" :key="week">
      <template v-for="(date, index) in row" :key="index">
        <slot v-if="date" :date="date" />
        <td v-else />
      </template>
    </tr>
  </tbody>
</template>
