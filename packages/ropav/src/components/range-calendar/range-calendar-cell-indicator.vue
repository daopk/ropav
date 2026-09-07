<script setup lang="ts" vapor>
import type { RangeCalendarCellIndicatorProps } from "./range-calendar.types";

const props = defineProps<RangeCalendarCellIndicatorProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span
    aria-hidden="true"
    :class="['rp-range-calendar__cell-indicator', props.class]"
    data-slot="range-calendar-cell-indicator"
  >
    <slot />
  </span>
</template>
