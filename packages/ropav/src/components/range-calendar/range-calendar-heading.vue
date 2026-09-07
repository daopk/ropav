<script setup lang="ts" vapor>
import type { RangeCalendarHeadingProps } from "./range-calendar.types";

import { useCalendarHeading } from "../../composables/use-calendar-heading";
import { useCalendarStateContext } from "../calendar/calendar.context";

const props = defineProps<RangeCalendarHeadingProps>();

const { state } = useCalendarStateContext();

const heading = useCalendarHeading(
  { format: () => props.format, offset: () => props.offset },
  state,
);
</script>

<template>
  <h2
    aria-hidden="true"
    :class="['rp-range-calendar__heading', props.class]"
    data-slot="range-calendar-heading"
  >
    {{ heading }}
  </h2>
</template>
