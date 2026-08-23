<script setup lang="ts" vapor>
import type {CalendarCellIndicatorProps} from "./calendar.types";

import {computed} from "vue";

import {useCalendarContext} from "./calendar.context";

const props = defineProps<CalendarCellIndicatorProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useCalendarContext();

const styles = computed(() => slots.value.cellIndicator({class: props.class}));
</script>

<template>
  <span aria-hidden="true" :class="styles" data-slot="calendar-cell-indicator">
    <slot />
  </span>
</template>
