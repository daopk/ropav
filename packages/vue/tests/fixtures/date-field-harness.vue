<script setup lang="ts" vapor>
import type {DateFieldHarnessProps} from "./date-field.types";

import {provideLocale} from "@/composables/use-locale";

import DateFieldHost from "./date-field-host.vue";

/*
 * The locale has to come from an ancestor, so the harness is a component of its own. Its
 * three-state booleans default to undefined for the same reason the host's do: a cast `false`
 * forwarded on is not the same as absent.
 */
const props = withDefaults(defineProps<DateFieldHarnessProps>(), {
  autoFocus: undefined,
  isDisabled: undefined,
  isRequired: undefined,
});

provideLocale(() => props.locale);
</script>

<template>
  <DateFieldHost
    :id="props.id"
    :aria-described-by="props.ariaDescribedBy"
    :aria-label="props.ariaLabel"
    :auto-focus="props.autoFocus"
    :default-value="props.defaultValue"
    :description="props.description"
    :granularity="props.granularity"
    :is-disabled="props.isDisabled"
    :is-required="props.isRequired"
    :label="props.label"
    :max-value="props.maxValue"
    :min-value="props.minValue"
    :name="props.name"
    :on-change="props.onChange"
    :on-focus-change="props.onFocusChange"
    :on-ready="props.onReady"
    :role="props.role"
    :validation-behavior="props.validationBehavior"
    :value="props.value"
  />
</template>
