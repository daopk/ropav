<script setup lang="ts" vapor>
import type { RangeCalendarGridProps } from "./range-calendar.types";

import { endOfMonth } from "@internationalized/date";
import { computed } from "vue";

import { useCalendarGrid } from "../../composables/use-calendar-grid";
import { DEFAULT_WEEKDAY_STYLE } from "../../utils/calendar";
import { provideCalendarGridContext, useCalendarStateContext } from "../calendar/calendar.context";

import { provideRangeCalendarContext, useRangeCalendarContext } from "./range-calendar.context";

const props = withDefaults(defineProps<RangeCalendarGridProps>(), {
  weekdayStyle: DEFAULT_WEEKDAY_STYLE,
});

defineSlots<{ default?: () => unknown }>();

const { dayView, slots } = useRangeCalendarContext();
const { calendar, state } = useCalendarStateContext();

/** Where this grid starts, which is the calendar's own start plus whatever offset it was given. */
const startDate = computed(() => {
  const start = state.visibleRange.value.start;

  return props.offset ? start.add(props.offset) : start;
});

const grid = useCalendarGrid(
  {
    endDate: () => endOfMonth(startDate.value),
    firstDayOfWeek: () => state.firstDayOfWeek.value,
    startDate,
    weekdayStyle: () => props.weekdayStyle,
  },
  state,
  calendar.shared,
);

const styles = computed(() => slots.value.grid({ class: props.class }));

/*
 * The weekday width is republished rather than only passed to the hook, because a day view builds
 * its own header from the visible dates and needs to know how wide to write their names.
 */
provideRangeCalendarContext({
  dayView: computed(() => {
    const view = dayView.value;

    return view ? { ...view, weekdayStyle: props.weekdayStyle } : undefined;
  }),
  slots,
});

provideCalendarGridContext({
  headerAttrs: grid.headerAttrs,
  startDate,
  weekDays: grid.weekDays,
  weeksInMonth: grid.weeksInMonth,
});
</script>

<template>
  <table
    :cellpadding="0"
    :class="styles"
    data-slot="range-calendar-grid"
    v-bind="grid.attrs.value"
    @focusin="grid.onFocusin"
    @focusout="grid.onFocusout"
    @keydown="grid.onKeydown"
  >
    <slot />
  </table>
</template>
