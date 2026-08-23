<script setup lang="ts" vapor>
import type { CalendarGridHostProps } from "./calendar-grid-host.types";

import { createCalendar } from "@internationalized/date";

import { useCalendar } from "@/composables/use-calendar";
import { useCalendarGrid } from "@/composables/use-calendar-grid";
import { useCalendarState } from "@/composables/use-calendar-state";

/*
 * Every three-state boolean declares `default: undefined`: Vue casts an absent Boolean prop to
 * `false`, and a forwarded `false` is not the same as absent.
 */
const props = withDefaults(defineProps<CalendarGridHostProps>(), {
  isDisabled: undefined,
  isReadOnly: undefined,
});

const state = useCalendarState({
  createCalendar,
  defaultFocusedValue: () => props.defaultFocusedValue,
  isDisabled: () => props.isDisabled,
  isReadOnly: () => props.isReadOnly,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  selectionMode: () => props.selectionMode,
  visibleDuration: () => props.visibleDuration,
});

const calendar = useCalendar(
  { ariaLabel: () => props.ariaLabel, ariaLabelledby: () => props.ariaLabelledby },
  state,
);

const grid = useCalendarGrid(
  { firstDayOfWeek: () => props.firstDayOfWeek, weekdayStyle: () => props.weekdayStyle },
  state,
  calendar.shared,
);

props.onReady?.({ grid, state });
</script>

<template>
  <table
    data-slot="calendar-grid"
    v-bind="grid.attrs.value"
    @focusin="grid.onFocusin"
    @focusout="grid.onFocusout"
    @keydown="grid.onKeydown"
  >
    <thead data-slot="calendar-grid-header" v-bind="grid.headerAttrs.value">
      <tr>
        <th v-for="day in grid.weekDays.value" :key="day" data-slot="calendar-header-cell">
          {{ day }}
        </th>
      </tr>
    </thead>
    <tbody data-slot="calendar-grid-body">
      <tr v-for="week in grid.weeksInMonth.value" :key="week" data-slot="calendar-grid-row">
        <td
          v-for="(date, index) in state.getDatesInWeek(week - 1)"
          :key="index"
          data-slot="calendar-cell"
        >
          {{ date?.day ?? "" }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
