<script setup lang="ts">
import {
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
  <RangeCalendar aria-label="Stay">
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
</template>
