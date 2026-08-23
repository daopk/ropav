<script setup lang="ts" vapor>
import type { DatePickerHostProps } from "./date-picker-host.types";

import { provideLocale } from "@/composables/use-locale";

import DatePickerHarness from "./date-picker-harness.vue";

const props = defineProps<DatePickerHostProps>();

/*
 * The locale is provided here and read by the harness below rather than in the same component:
 * Vue resolves `inject` against the parent's provides, so a component never sees its own.
 */
provideLocale(() => props.locale);
</script>

<template>
  <DatePickerHarness v-bind="props" />
</template>
