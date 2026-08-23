<script setup lang="ts" vapor>
import type { CalendarHeadingHostProps } from "./calendar-heading-host.types";

import { provideLocale } from "@/composables/use-locale";

import CalendarHeadingHarness from "./calendar-heading-harness.vue";

const props = defineProps<CalendarHeadingHostProps>();

/*
 * The locale is provided here and read by the harness below rather than in the same component:
 * Vue resolves `inject` against the parent's provides, so a component never sees its own.
 */
provideLocale(() => props.locale);
</script>

<template>
  <CalendarHeadingHarness v-bind="props" />
</template>
