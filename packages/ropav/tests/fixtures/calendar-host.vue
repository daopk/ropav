<script setup lang="ts" vapor>
import type { CalendarHostProps } from "./calendar-host.types";

import { provideLocale } from "@/composables/use-locale";

import CalendarHarness from "./calendar-harness.vue";

const props = defineProps<CalendarHostProps>();

/*
 * The locale is provided here and read by the harness below rather than in the same component:
 * Vue resolves `inject` against the parent's provides, so a component never sees its own.
 */
provideLocale(() => props.locale);
</script>

<template>
  <CalendarHarness v-bind="props" />
</template>
