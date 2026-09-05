<script setup lang="ts">
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
  Label,
} from "ropav";
</script>

<template>
  <DatePicker class="w-72" name="date">
    <Label>Date</Label>

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

    <DatePickerPopover>
      <Calendar aria-label="Selected date">
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
            <template #default="{ date }">
              <CalendarCell :date />
            </template>
          </CalendarGridBody>
        </CalendarGrid>
      </Calendar>
    </DatePickerPopover>
  </DatePicker>
</template>
