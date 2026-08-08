<script setup lang="ts" vapor>
import type {FormRootProps} from "./form.types";

import {computed} from "vue";

import {provideFormContext} from "../../composables/use-form-validation-state";

const props = defineProps<FormRootProps>();

defineSlots<{default?: () => unknown}>();

// Held in computeds with a stable identity, so a field's watch on the errors fires once per
// server response rather than on every render of the form.
provideFormContext({
  validationBehavior: computed(() => props.validationBehavior ?? "native"),
  validationErrors: computed(() => props.validationErrors ?? {}),
});

// Under `"aria"` the fields report through ARIA alone, so the browser's own blocking and its
// error bubbles are turned off. Under `"native"` they are exactly what does the work.
const isNoValidate = computed(() => props.validationBehavior === "aria" || undefined);
</script>

<template>
  <form :class="props.class" data-slot="form" :novalidate="isNoValidate">
    <slot />
  </form>
</template>
