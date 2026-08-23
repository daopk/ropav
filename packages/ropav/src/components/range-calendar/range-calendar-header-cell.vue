<script setup lang="ts" vapor>
import type { RangeCalendarHeaderCellProps } from "./range-calendar.types";

import { computed } from "vue";

import { useRangeCalendarContext } from "./range-calendar.context";

const props = defineProps<RangeCalendarHeaderCellProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useRangeCalendarContext();

const styles = computed(() => slots.value.headerCell({ class: props.class }));
</script>

<template>
  <th :class="styles" data-slot="range-calendar-header-cell">
    <slot />
  </th>
</template>
