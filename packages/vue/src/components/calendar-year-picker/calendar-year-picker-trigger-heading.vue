<script setup lang="ts" vapor>
import type {
  CalendarYearPickerTriggerHeadingProps,
  CalendarYearPickerTriggerSlotProps,
} from "./calendar-year-picker.types";

import {computed} from "vue";

import {useCalendarHeading} from "../../composables/use-calendar-heading";
import {useCalendarStateContext} from "../calendar/calendar.context";

import {useYearPickerTriggerContext} from "./calendar-year-picker.context";

const props = defineProps<CalendarYearPickerTriggerHeadingProps>();

defineSlots<{default?: (props: CalendarYearPickerTriggerSlotProps) => unknown}>();

const {isOpen, monthYear, slots, toggle} = useYearPickerTriggerContext();
const {state} = useCalendarStateContext();

/*
 * The heading is computed again rather than taken from the trigger, because this part accepts its
 * own `format` and `offset` — the trigger's copy is the plain one that names the button.
 */
const heading = useCalendarHeading({format: () => props.format, offset: () => props.offset}, state);

const styles = computed(() => slots.value.triggerHeading({class: props.class}));

const slotProps = computed<CalendarYearPickerTriggerSlotProps>(() => ({
  isOpen: isOpen.value,
  monthYear: monthYear.value,
  toggle,
}));
</script>

<template>
  <span :class="styles" data-slot="calendar-year-picker-trigger-heading">
    <slot v-bind="slotProps">{{ heading }}</slot>
  </span>
</template>
