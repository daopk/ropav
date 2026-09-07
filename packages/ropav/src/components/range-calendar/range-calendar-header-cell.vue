<script setup lang="ts" vapor>
import type { RangeCalendarHeaderCellProps } from "./range-calendar.types";

const props = defineProps<RangeCalendarHeaderCellProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <th
    :class="['rp-range-calendar__header-cell', props.class]"
    data-slot="range-calendar-header-cell"
  >
    <slot />
  </th>
</template>
