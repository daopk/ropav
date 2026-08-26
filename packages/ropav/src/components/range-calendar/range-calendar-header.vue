<script setup lang="ts" vapor>
import type { RangeCalendarHeaderProps } from "./range-calendar.types";

import { computed } from "vue";

import { useRangeCalendarContext } from "./range-calendar.context";

const props = defineProps<RangeCalendarHeaderProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useRangeCalendarContext();

const styles = computed(() => slots.value.header({ class: props.class }));
</script>

<template>
  <div :class="styles" data-slot="range-calendar-header">
    <slot />
  </div>
</template>
