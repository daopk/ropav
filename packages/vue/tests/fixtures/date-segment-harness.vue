<script setup lang="ts" vapor>
import type {DateSegmentHarnessProps} from "./date-segment.types";

import {provideLocale} from "@/composables/use-locale";

import DateSegmentHost from "./date-segment-host.vue";

/*
 * The locale has to come from an ancestor, so the harness is a component of its own. Its
 * three-state booleans default to undefined for the same reason the host's do: a cast `false`
 * forwarded on is not the same as absent.
 */
const props = withDefaults(defineProps<DateSegmentHarnessProps>(), {
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
});

provideLocale(() => props.locale);
</script>

<template>
  <DateSegmentHost
    :aria-described-by="props.ariaDescribedBy"
    :aria-label="props.ariaLabel"
    :aria-labelled-by="props.ariaLabelledBy"
    :default-value="props.defaultValue"
    :granularity="props.granularity"
    :is-disabled="props.isDisabled"
    :is-invalid="props.isInvalid"
    :is-read-only="props.isReadOnly"
    :max-granularity="props.maxGranularity"
    :max-value="props.maxValue"
    :min-value="props.minValue"
    :on-change="props.onChange"
    :on-ready="props.onReady"
    :value="props.value"
  />
</template>
