<script setup lang="ts" vapor>
import type { RangeCalendarCellIndicatorProps } from "./range-calendar.types";

import { computed } from "vue";

import { useRangeCalendarContext } from "./range-calendar.context";

const props = defineProps<RangeCalendarCellIndicatorProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useRangeCalendarContext();

const styles = computed(() => slots.value.cellIndicator({ class: props.class }));
</script>

<template>
  <span aria-hidden="true" :class="styles" data-slot="range-calendar-cell-indicator">
    <slot />
  </span>
</template>
