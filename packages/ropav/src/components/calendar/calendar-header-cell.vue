<script setup lang="ts" vapor>
import type { CalendarHeaderCellProps } from "./calendar.types";

import { computed } from "vue";

import { useCalendarContext } from "./calendar.context";

const props = defineProps<CalendarHeaderCellProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useCalendarContext();

const styles = computed(() => slots.value.headerCell({ class: props.class }));
</script>

<template>
  <th :class="styles" data-slot="calendar-header-cell">
    <slot />
  </th>
</template>
