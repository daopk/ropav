<script setup lang="ts" vapor>
import type {CalendarCellHostProps} from "./calendar-cell-host.types";

import {provideLocale} from "@/composables/use-locale";

import CalendarCellHarness from "./calendar-cell-harness.vue";

const props = defineProps<CalendarCellHostProps>();

/*
 * The locale is provided here and read by the harness below rather than in the same component:
 * Vue resolves `inject` against the parent's provides, so a component never sees its own.
 */
provideLocale(() => props.locale);
</script>

<template>
  <CalendarCellHarness v-bind="props" />
</template>
