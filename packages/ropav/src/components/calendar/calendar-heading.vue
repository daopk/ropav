<script setup lang="ts" vapor>
import type { CalendarHeadingProps } from "./calendar.types";

import { computed } from "vue";

import { useCalendarHeading } from "../../composables/use-calendar-heading";

import { useCalendarContext, useCalendarStateContext } from "./calendar.context";

const props = defineProps<CalendarHeadingProps>();

const { slots } = useCalendarContext();
const { state } = useCalendarStateContext();

const heading = useCalendarHeading(
  { format: () => props.format, offset: () => props.offset },
  state,
);

const styles = computed(() => slots.value.heading({ class: props.class }));
</script>

<template>
  <h2 aria-hidden="true" :class="styles" data-slot="calendar-heading">{{ heading }}</h2>
</template>
