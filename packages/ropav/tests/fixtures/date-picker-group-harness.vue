<script setup lang="ts" vapor>
import type { DatePickerGroupHarnessProps } from "./date-picker-group.types";

import { provideLocale } from "@/composables/use-locale";

import DatePickerGroupHost from "./date-picker-group-host.vue";

/*
 * The locale has to come from an ancestor, so the harness is a component of its own. Its
 * three-state boolean defaults to undefined for the same reason the host's does: a cast `false`
 * forwarded on is not the same as absent.
 */
const props = withDefaults(defineProps<DatePickerGroupHarnessProps>(), {
  disableArrowNavigation: undefined,
});

provideLocale(() => props.locale);
</script>

<template>
  <DatePickerGroupHost
    :disable-arrow-navigation="props.disableArrowNavigation"
    :on-ready="props.onReady"
    :placeholders="props.placeholders"
    :set-open="props.setOpen"
  />
</template>
