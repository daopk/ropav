<script setup lang="ts" vapor>
import type {RangeCalendarHeadingProps} from "./range-calendar.types";

import {computed} from "vue";

import {useCalendarHeading} from "../../composables/use-calendar-heading";
import {useCalendarStateContext} from "../calendar/calendar.context";

import {useRangeCalendarContext} from "./range-calendar.context";

const props = defineProps<RangeCalendarHeadingProps>();

const {slots} = useRangeCalendarContext();
const {state} = useCalendarStateContext();

const heading = useCalendarHeading({format: () => props.format, offset: () => props.offset}, state);

const styles = computed(() => slots.value.heading({class: props.class}));
</script>

<template>
  <h2 aria-hidden="true" :class="styles" data-slot="range-calendar-heading">{{ heading }}</h2>
</template>
