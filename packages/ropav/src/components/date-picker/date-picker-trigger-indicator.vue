<script setup lang="ts" vapor>
import type { DatePickerTriggerIndicatorProps } from "./date-picker.types";

import { computed } from "vue";

import { IconCalendar } from "../icons";

import { useDatePickerContext } from "./date-picker.context";

const props = defineProps<DatePickerTriggerIndicatorProps>();

defineSlots<{ default?: () => unknown }>();

const picker = useDatePickerContext();

const styles = computed(() => picker.slots.value.triggerIndicator({ class: props.class }));
</script>

<template>
  <span aria-hidden="true" :class="styles" data-slot="date-picker-trigger-indicator">
    <slot><IconCalendar /></slot>
  </span>
</template>
