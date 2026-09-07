<script setup lang="ts" vapor>
import type { CalendarHeaderProps } from "./calendar.types";

const props = defineProps<CalendarHeaderProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-calendar__header', props.class]" data-slot="calendar-header">
    <slot />
  </div>
</template>
