<script setup lang="ts" vapor>
import type {CalendarGridHeaderProps, CalendarGridHeaderSlotProps} from "./calendar.types";

import {computed} from "vue";

import {useLocale} from "../../composables/use-locale";
import {getDayViewWeekDayLabels} from "../../utils/calendar";

import {useCalendarContext, useCalendarGridContext} from "./calendar.context";

const props = defineProps<CalendarGridHeaderProps>();

defineSlots<{default?: (props: CalendarGridHeaderSlotProps) => unknown}>();

const {dayView, slots} = useCalendarContext();
const {headerAttrs, weekDays} = useCalendarGridContext();
const locale = useLocale();

const styles = computed(() => slots.value.gridHeader({class: props.class}));

/**
 * A day view spanning a week or more labels its own columns.
 *
 * The composable's week days come from a generic week, which is right for a month grid but wrong
 * here: a seven-day view starting on a Wednesday has to say so.
 *
 * React reaches this branch on `dayView.days >= 7 && typeof children === "function"`. A Vue slot is
 * always a function, so the condition is just the day count — nothing is lost, because both
 * branches render one column per name.
 */
const isCustomDayView = computed(() => Boolean(dayView.value && dayView.value.days >= 7));

const days = computed(() => {
  const view = dayView.value;

  if (!isCustomDayView.value || !view) return weekDays.value;

  return getDayViewWeekDayLabels(
    view.visibleRange.start,
    locale.value.locale,
    view.firstDayOfWeek,
    view.weekdayStyle,
    view.timeZone,
  );
});
</script>

<template>
  <thead :class="styles" data-slot="calendar-grid-header" v-bind="headerAttrs">
    <tr>
      <template v-for="(day, index) in days" :key="index">
        <slot :day="day" />
      </template>
    </tr>
  </thead>
</template>
