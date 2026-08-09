<script setup lang="ts" vapor>
import type {RangeCalendarHostProps} from "./range-calendar-host.types";

import {provideLocale} from "@/composables/use-locale";

import RangeCalendarHarness from "./range-calendar-harness.vue";

const props = defineProps<RangeCalendarHostProps>();

/*
 * The locale is provided here and read by the harness below rather than in the same component:
 * Vue resolves `inject` against the parent's provides, so a component never sees its own.
 */
provideLocale(() => props.locale);
</script>

<template>
  <RangeCalendarHarness v-bind="props" />
</template>
