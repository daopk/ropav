<script setup lang="ts" vapor>
import type { CalendarCellIndicatorProps } from "./calendar.types";

const props = defineProps<CalendarCellIndicatorProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span
    aria-hidden="true"
    :class="['rp-calendar__cell-indicator', props.class]"
    data-slot="calendar-cell-indicator"
  >
    <slot />
  </span>
</template>
