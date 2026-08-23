<script setup lang="ts" vapor>
import type { DateRangePickerTriggerIndicatorProps } from "./date-range-picker.types";

import { computed } from "vue";

import { IconCalendar } from "../icons";

import { useDateRangePickerContext } from "./date-range-picker.context";

const props = defineProps<DateRangePickerTriggerIndicatorProps>();

defineSlots<{ default?: () => unknown }>();

const picker = useDateRangePickerContext();

const styles = computed(() => picker.slots.value.triggerIndicator({ class: props.class }));
</script>

<template>
  <span aria-hidden="true" :class="styles" data-slot="date-range-picker-trigger-indicator">
    <slot><IconCalendar /></slot>
  </span>
</template>
