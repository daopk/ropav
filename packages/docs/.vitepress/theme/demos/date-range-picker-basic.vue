<script setup lang="ts">
import {
  DateRangePicker,
  DateRangePickerGroup,
  DateRangePickerInput,
  DateRangePickerPopover,
  DateRangePickerRangeSeparator,
  DateRangePickerSegment,
  DateRangePickerSuffix,
  DateRangePickerTrigger,
  DateRangePickerTriggerIndicator,
  Label,
  RangeCalendar,
  RangeCalendarCell,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeaderCell,
  RangeCalendarHeading,
  RangeCalendarNavButton,
} from "ropav";
</script>

<template>
  <DateRangePicker class="field" end-name="endDate" start-name="startDate">
    <Label>Trip dates</Label>

    <DateRangePickerGroup full-width>
      <DateRangePickerInput slot="start">
        <template #default="{ segment }">
          <DateRangePickerSegment :segment />
        </template>
      </DateRangePickerInput>
      <DateRangePickerRangeSeparator />
      <DateRangePickerInput slot="end">
        <template #default="{ segment }">
          <DateRangePickerSegment :segment />
        </template>
      </DateRangePickerInput>
      <DateRangePickerSuffix>
        <DateRangePickerTrigger>
          <DateRangePickerTriggerIndicator />
        </DateRangePickerTrigger>
      </DateRangePickerSuffix>
    </DateRangePickerGroup>

    <DateRangePickerPopover>
      <RangeCalendar aria-label="Selected range">
        <RangeCalendarHeader>
          <RangeCalendarNavButton slot="previous" />
          <RangeCalendarHeading />
          <RangeCalendarNavButton slot="next" />
        </RangeCalendarHeader>
        <RangeCalendarGrid>
          <RangeCalendarGridHeader>
            <template #default="{ day }">
              <RangeCalendarHeaderCell>{{ day }}</RangeCalendarHeaderCell>
            </template>
          </RangeCalendarGridHeader>
          <RangeCalendarGridBody>
            <template #default="{ date }">
              <RangeCalendarCell :date />
            </template>
          </RangeCalendarGridBody>
        </RangeCalendarGrid>
      </RangeCalendar>
    </DateRangePickerPopover>
  </DateRangePicker>
</template>

<style scoped>
.field {
  width: calc(var(--rp-spacing) * 80);
}
</style>
