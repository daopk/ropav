<script setup lang="ts" vapor>
import type { CalendarHeadingProps } from "./calendar.types";

import { useCalendarHeading } from "../../composables/use-calendar-heading";

import { useCalendarStateContext } from "./calendar.context";

const props = defineProps<CalendarHeadingProps>();

const { state } = useCalendarStateContext();

const heading = useCalendarHeading(
  { format: () => props.format, offset: () => props.offset },
  state,
);
</script>

<template>
  <h2
    aria-hidden="true"
    :class="['rp-calendar__heading', props.class]"
    data-slot="calendar-heading"
  >
    {{ heading }}
  </h2>
</template>
