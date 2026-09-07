<script setup lang="ts" vapor>
import type { RangeCalendarHeaderProps } from "./range-calendar.types";

const props = defineProps<RangeCalendarHeaderProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-range-calendar__header', props.class]" data-slot="range-calendar-header">
    <slot />
  </div>
</template>
