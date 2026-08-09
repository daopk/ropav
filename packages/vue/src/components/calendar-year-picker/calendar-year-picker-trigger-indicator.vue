<script setup lang="ts" vapor>
import type {
  CalendarYearPickerTriggerIndicatorProps,
  CalendarYearPickerTriggerSlotProps,
} from "./calendar-year-picker.types";

import {computed} from "vue";

import {IconChevronRight} from "../icons";

import {useYearPickerTriggerContext} from "./calendar-year-picker.context";

const props = defineProps<CalendarYearPickerTriggerIndicatorProps>();

defineSlots<{default?: (props: CalendarYearPickerTriggerSlotProps) => unknown}>();

const {isOpen, monthYear, slots, toggle} = useYearPickerTriggerContext();

const styles = computed(() => slots.value.triggerIndicator({class: props.class}));

const slotProps = computed<CalendarYearPickerTriggerSlotProps>(() => ({
  isOpen: isOpen.value,
  monthYear: monthYear.value,
  toggle,
}));
</script>

<template>
  <span aria-hidden="true" :class="styles" data-slot="calendar-year-picker-trigger-indicator">
    <slot v-bind="slotProps">
      <IconChevronRight height="1em" width="1em" />
    </slot>
  </span>
</template>
