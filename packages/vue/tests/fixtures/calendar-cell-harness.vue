<script setup lang="ts" vapor>
import type {CalendarCellHostProps} from "./calendar-cell-host.types";
import type {UseCalendarCellReturn} from "@/composables/use-calendar-cell";
import type {CalendarDate} from "@internationalized/date";

import {createCalendar, isSameMonth} from "@internationalized/date";
import {computed} from "vue";

import {useCalendar} from "@/composables/use-calendar";
import {useCalendarState} from "@/composables/use-calendar-state";

import CalendarCellPart from "./calendar-cell-part.vue";

/*
 * Every three-state boolean declares `default: undefined`: Vue casts an absent Boolean prop to
 * `false`, and a forwarded `false` is not the same as absent.
 */
const props = withDefaults(defineProps<CalendarCellHostProps>(), {
  autoFocus: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
});

const state = useCalendarState({
  autoFocus: () => props.autoFocus,
  createCalendar,
  defaultFocusedValue: () => props.defaultFocusedValue,
  isDateUnavailable: props.isDateUnavailable,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  selectionMode: () => props.selectionMode,
  value: () => props.value,
  visibleDuration: () => props.visibleDuration,
});

const calendar = useCalendar({isDisabled: () => props.isDisabled}, state);

const cells = new Map<string, UseCalendarCellReturn>();

const register = (date: string, cell: UseCalendarCellReturn) => {
  cells.set(date, cell);
};

const rows = computed(() => {
  const result: {date: CalendarDate; isOutsideMonth: boolean}[][] = [];
  const duration = state.visibleDuration.value;
  const monthStart = state.visibleRange.value.start;

  for (let week = 0; week < state.getWeeksInMonth(); week++) {
    result.push(
      state
        .getDatesInWeek(week)
        .filter((date) => date != null)
        .map((date) => ({
          date: date!,
          // Only a month view has dates from a neighbouring month to grey out.
          isOutsideMonth: duration.days || duration.weeks ? false : !isSameMonth(monthStart, date!),
        })),
    );
  }

  return result;
});

props.onReady?.({cells, state});
</script>

<template>
  <table data-slot="calendar-grid">
    <tbody>
      <tr v-for="(row, week) in rows" :key="week">
        <CalendarCellPart
          v-for="entry in row"
          :key="String(entry.date)"
          :date="entry.date"
          :is-outside-month="entry.isOutsideMonth"
          :register="register"
          :shared="calendar.shared"
          :state="state"
        />
      </tr>
    </tbody>
  </table>
</template>
