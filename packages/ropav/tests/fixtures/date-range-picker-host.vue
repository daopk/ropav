<script setup lang="ts" vapor>
import type { DateRangePickerHostProps } from "./date-range-picker-host.types";

import { provideLocale } from "@/composables/use-locale";

import DateRangePickerHarness from "./date-range-picker-harness.vue";

const props = defineProps<DateRangePickerHostProps>();

/*
 * The locale is provided here and read by the harness below rather than in the same component:
 * Vue resolves `inject` against the parent's provides, so a component never sees its own.
 */
provideLocale(() => props.locale);
</script>

<template>
  <DateRangePickerHarness v-bind="props" />
</template>
