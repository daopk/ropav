<script setup lang="ts" vapor>
import type { CalendarGridHostProps } from "./calendar-grid-host.types";

import { provideLocale } from "@/composables/use-locale";

import CalendarGridHarness from "./calendar-grid-harness.vue";

const props = defineProps<CalendarGridHostProps>();

/*
 * The locale is provided here and read by the harness below rather than in the same component:
 * Vue resolves `inject` against the parent's provides, so a component never sees its own.
 */
provideLocale(() => props.locale);
</script>

<template>
  <CalendarGridHarness v-bind="props" />
</template>
