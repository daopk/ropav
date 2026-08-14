<script setup lang="ts" vapor>
import type {DateRangePickerRangeSeparatorProps} from "./date-range-picker.types";

import {computed} from "vue";

import {useDateRangePickerContext} from "./date-range-picker.context";

const props = defineProps<DateRangePickerRangeSeparatorProps>();

defineSlots<{default?: () => unknown}>();

const picker = useDateRangePickerContext();

const styles = computed(() => picker.slots.value.rangeSeparator({class: props.class}));

/*
 * Hidden from assistive technology, and a dash by default. The two rows of segments already name
 * themselves "Start Date" and "End Date", so a dash read out between them would only be a word in
 * the way.
 */
</script>

<template>
  <span aria-hidden="true" :class="styles" data-slot="date-range-picker-range-separator"
    ><slot> - </slot></span
  >
</template>
