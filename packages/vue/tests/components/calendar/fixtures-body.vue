<script setup lang="ts" vapor>
import type {CalendarFixtureProps} from "./fixtures.types";

import {
  CalendarCell,
  CalendarCellIndicator,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarNavButton,
  CalendarRoot,
} from "@/components/calendar";
import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
} from "@/components/calendar-year-picker";

/*
 * Which way a nav button pages is bound through an object rather than written as `slot="previous"`,
 * because the linter reads a literal `slot` attribute as Vue 2 slot syntax and rewrites it. It is an
 * ordinary prop here, and the same trick the component itself uses to put it back in the DOM.
 */
const PREVIOUS = {slot: "previous"} as const;
const NEXT = {slot: "next"} as const;

/*
 * The three-state booleans need explicit `undefined` here too: forwarding a cast `false` would turn
 * the calendar controlled, or claim it valid, without any test asking for it.
 */
const props = withDefaults(defineProps<CalendarFixtureProps>(), {
  autoFocus: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isYearPickerOpen: undefined,
});
</script>

<template>
  <CalendarRoot v-if="props.attributeForm" aria-label="Event date" is-disabled>
    <CalendarGrid>
      <CalendarGridHeader>
        <template #default="{day}">
          <CalendarHeaderCell>{{ day }}</CalendarHeaderCell>
        </template>
      </CalendarGridHeader>
      <CalendarGridBody>
        <template #default="{date}">
          <CalendarCell :date="date" />
        </template>
      </CalendarGridBody>
    </CalendarGrid>
  </CalendarRoot>
  <CalendarRoot
    v-else
    :id="props.id"
    :aria-label="props.ariaLabel ?? 'Event date'"
    :auto-focus="props.autoFocus"
    :class="props.class"
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
    :selection-mode="props.selectionMode"
    :value="props.value"
    :visible-duration="props.visibleDuration"
    :weeks-in-month="props.weeksInMonth"
  >
    <CalendarHeader>
      <CalendarNavButton v-bind="PREVIOUS" />
      <CalendarYearPickerTrigger v-if="props.withYearPicker">
        <CalendarYearPickerTriggerHeading />
        <CalendarYearPickerTriggerIndicator />
      </CalendarYearPickerTrigger>
      <CalendarHeading v-else />
      <CalendarNavButton v-bind="NEXT" />
    </CalendarHeader>
    <CalendarGrid :weekday-style="props.weekdayStyle">
      <CalendarGridHeader>
        <template #default="{day}">
          <CalendarHeaderCell>{{ day }}</CalendarHeaderCell>
        </template>
      </CalendarGridHeader>
      <CalendarGridBody>
        <template #default="{date}">
          <CalendarCell :date="date">
            <template v-if="props.withCellIndicator" #default="{formattedDate}">
              {{ formattedDate }}
              <CalendarCellIndicator />
            </template>
          </CalendarCell>
        </template>
      </CalendarGridBody>
    </CalendarGrid>
    <CalendarGrid v-if="props.withSecondMonth" :offset="{months: 1}">
      <CalendarGridHeader>
        <template #default="{day}">
          <CalendarHeaderCell>{{ day }}</CalendarHeaderCell>
        </template>
      </CalendarGridHeader>
      <CalendarGridBody>
        <template #default="{date}">
          <CalendarCell :date="date" />
        </template>
      </CalendarGridBody>
    </CalendarGrid>
    <CalendarYearPickerGrid v-if="props.withYearPicker">
      <CalendarYearPickerGridBody>
        <template #default="{year}">
          <CalendarYearPickerCell :year="year" />
        </template>
      </CalendarYearPickerGridBody>
    </CalendarYearPickerGrid>
  </CalendarRoot>
</template>
