<script setup lang="ts" vapor>
import type { CalendarHeaderCellProps } from "./calendar.types";

const props = defineProps<CalendarHeaderCellProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <th :class="['rp-calendar__header-cell', props.class]" data-slot="calendar-header-cell">
    <slot />
  </th>
</template>
