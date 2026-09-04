<script setup lang="ts" vapor>
import type { RangeCalendarFixtureProps } from "./fixtures.types";

import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
} from "@/components/calendar-year-picker";
import {
  RangeCalendarCell,
  RangeCalendarCellIndicator,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeaderCell,
  RangeCalendarHeading,
  RangeCalendarNavButton,
  RangeCalendar,
} from "@/components/range-calendar";

/*
 * Which way a nav button pages is bound through an object rather than written as `slot="previous"`,
 * because the linter reads a literal `slot` attribute as Vue 2 slot syntax and rewrites it. It is an
 * ordinary prop here, and the same trick the component itself uses to put it back in the DOM.
 */
const PREVIOUS = { slot: "previous" } as const;
const NEXT = { slot: "next" } as const;

/*
 * The three-state booleans need explicit `undefined` here too: forwarding a cast `false` would turn
 * the calendar controlled, or claim it valid, without any test asking for it.
 */
const props = withDefaults(defineProps<RangeCalendarFixtureProps>(), {
  allowsNonContiguousRanges: undefined,
  autoFocus: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isYearPickerOpen: undefined,
});
</script>

<template>
  <RangeCalendar v-if="props.attributeForm" aria-label="Stay" is-disabled>
    <RangeCalendarGrid>
      <RangeCalendarGridHeader>
        <template #default="{ day }">
          <RangeCalendarHeaderCell>{{ day }}</RangeCalendarHeaderCell>
        </template>
      </RangeCalendarGridHeader>
      <RangeCalendarGridBody>
        <template #default="{ date }">
          <RangeCalendarCell :date="date" />
        </template>
      </RangeCalendarGridBody>
    </RangeCalendarGrid>
  </RangeCalendar>
  <RangeCalendar
    v-else
    :id="props.id"
    :allows-non-contiguous-ranges="props.allowsNonContiguousRanges"
    :aria-label="props.ariaLabel ?? 'Stay'"
    :auto-focus="props.autoFocus"
    :class="props.class"
    :commit-behavior="props.commitBehavior"
    :default-focused-value="props.defaultFocusedValue"
    :default-value="props.defaultValue"
    :default-year-picker-open="props.defaultYearPickerOpen"
    :first-day-of-week="props.firstDayOfWeek"
    :focused-value="props.focusedValue"
    :is-date-unavailable="props.isDateUnavailable"
    :is-disabled="props.isDisabled"
    :is-invalid="props.isInvalid"
    :is-read-only="props.isReadOnly"
    :is-year-picker-open="props.isYearPickerOpen"
    :max-value="props.maxValue"
    :min-value="props.minValue"
    :page-behavior="props.pageBehavior"
    :selection-alignment="props.selectionAlignment"
    :value="props.value"
    :visible-duration="props.visibleDuration"
    :weeks-in-month="props.weeksInMonth"
    @update:focused-value="(value) => props['onUpdate:focusedValue']?.(value)"
    @update:value="props.onValueChange"
  >
    <RangeCalendarHeader>
      <RangeCalendarNavButton v-bind="PREVIOUS" />
      <CalendarYearPickerTrigger v-if="props.withYearPicker">
        <CalendarYearPickerTriggerHeading />
        <CalendarYearPickerTriggerIndicator />
      </CalendarYearPickerTrigger>
      <RangeCalendarHeading v-else />
      <RangeCalendarNavButton v-bind="NEXT" />
    </RangeCalendarHeader>
    <RangeCalendarGrid :weekday-style="props.weekdayStyle">
      <RangeCalendarGridHeader>
        <template #default="{ day }">
          <RangeCalendarHeaderCell>{{ day }}</RangeCalendarHeaderCell>
        </template>
      </RangeCalendarGridHeader>
      <RangeCalendarGridBody>
        <template #default="{ date }">
          <RangeCalendarCell :date="date">
            <template v-if="props.withCellIndicator" #default="{ formattedDate }">
              {{ formattedDate }}
              <RangeCalendarCellIndicator />
            </template>
          </RangeCalendarCell>
        </template>
      </RangeCalendarGridBody>
    </RangeCalendarGrid>
    <RangeCalendarGrid v-if="props.withSecondMonth" :offset="{ months: 1 }">
      <RangeCalendarGridHeader>
        <template #default="{ day }">
          <RangeCalendarHeaderCell>{{ day }}</RangeCalendarHeaderCell>
        </template>
      </RangeCalendarGridHeader>
      <RangeCalendarGridBody>
        <template #default="{ date }">
          <RangeCalendarCell :date="date" />
        </template>
      </RangeCalendarGridBody>
    </RangeCalendarGrid>
    <CalendarYearPickerGrid v-if="props.withYearPicker">
      <CalendarYearPickerGridBody>
        <template #default="{ year }">
          <CalendarYearPickerCell :year="year" />
        </template>
      </CalendarYearPickerGridBody>
    </CalendarYearPickerGrid>
  </RangeCalendar>
</template>
