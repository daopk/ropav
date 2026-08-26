<script setup lang="ts" vapor>
import type { CalendarHeaderProps } from "./calendar.types";

import { computed } from "vue";

import { useCalendarContext } from "./calendar.context";

const props = defineProps<CalendarHeaderProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useCalendarContext();

const styles = computed(() => slots.value.header({ class: props.class }));
</script>

<template>
  <div :class="styles" data-slot="calendar-header">
    <slot />
  </div>
</template>
