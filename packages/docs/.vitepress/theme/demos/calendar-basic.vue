<script setup lang="ts">
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarNavButton,
} from "ropav";
</script>

<template>
  <Calendar aria-label="Event date">
    <CalendarHeader>
      <CalendarNavButton slot="previous" />
      <CalendarHeading />
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
</template>
