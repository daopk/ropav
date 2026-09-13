<script setup lang="ts">
import type { DateValue } from "@internationalized/date";

import {
  getLocalTimeZone,
  isWeekend,
  Time,
  toCalendarDateTime,
  today,
} from "@internationalized/date";
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarNavButton,
  DatePicker,
  DatePickerGroup,
  DatePickerInput,
  DatePickerPopover,
  DatePickerSegment,
  DatePickerSuffix,
  DatePickerTrigger,
  DatePickerTriggerIndicator,
  Description,
  FieldGroup,
  Label,
  TimeField,
  TimeFieldGroup,
  TimeFieldInput,
  TimeFieldSegment,
  useLocale,
} from "ropav";
import { computed, shallowRef } from "vue";

const zone = getLocalTimeZone();
const locale = useLocale();

const earliest = today(zone);

const date = shallowRef<DateValue | null>(earliest.add({ days: 1 }));
const time = shallowRef<Time | null>(new Time(9, 30));

/* Which days are the weekend is a property of the locale, not of the calendar. */
const isDateUnavailable = (value: DateValue) => isWeekend(value, locale.value.locale);

/*
 * A date and a time are separate values and stay that way until something needs one instant. The
 * screen is what joins them, because only the screen knows they belong to the same booking.
 */
const booking = computed(() =>
  date.value && time.value ? toCalendarDateTime(date.value, time.value) : null,
);

const formatted = computed(() =>
  booking.value
    ? booking.value.toDate(zone).toLocaleString(locale.value.locale, {
        dateStyle: "full",
        timeStyle: "short",
      })
    : "Pick a weekday and a time.",
);
</script>

<template>
  <div class="screen">
    <FieldGroup>
      <DatePicker
        v-model:value="date"
        is-required
        :is-date-unavailable="isDateUnavailable"
        :min-value="earliest"
        name="day"
      >
        <Label>Day</Label>

        <DatePickerGroup full-width>
          <DatePickerInput>
            <template #default="{ segment }">
              <DatePickerSegment :segment />
            </template>
          </DatePickerInput>
          <DatePickerSuffix>
            <DatePickerTrigger>
              <DatePickerTriggerIndicator />
            </DatePickerTrigger>
          </DatePickerSuffix>
        </DatePickerGroup>

        <Description>Weekends and anything before today are not bookable.</Description>

        <DatePickerPopover>
          <Calendar aria-label="Booking day">
            <CalendarHeader>
              <CalendarNavButton slot="previous" />
              <CalendarNavButton slot="next" />
            </CalendarHeader>
            <CalendarGrid>
              <CalendarGridHeader>
                <template #default="{ day }">
                  <CalendarHeaderCell>{{ day }}</CalendarHeaderCell>
                </template>
              </CalendarGridHeader>
              <CalendarGridBody>
                <template #default="{ date: cell }">
                  <CalendarCell :date="cell" />
                </template>
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </DatePickerPopover>
      </DatePicker>

      <TimeField v-model:value="time" is-required name="start">
        <Label>Start</Label>
        <TimeFieldGroup>
          <TimeFieldInput>
            <template #default="{ segment }">
              <TimeFieldSegment :segment />
            </template>
          </TimeFieldInput>
        </TimeFieldGroup>
      </TimeField>
    </FieldGroup>

    <p class="result">{{ formatted }}</p>
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  max-width: var(--rp-container-sm);
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 5);
}

.result {
  padding-top: calc(var(--rp-spacing) * 4);
  border-top: 1px solid var(--rp-border);
  color: var(--rp-muted);
  font-size: var(--rp-text-sm);
  line-height: var(--rp-text-sm--line-height);
}
</style>
