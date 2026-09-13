<script setup lang="ts" vapor>
import type { FormRootProps } from "./form.types";

import { computed, shallowRef } from "vue";

import { provideFormContext } from "../../composables/use-form-validation-state";

const props = defineProps<FormRootProps>();

defineSlots<{ default?: () => unknown }>();

/*
 * Under `"native"` an invalid form never reaches this — the browser refuses the submit and fires
 * `invalid` at each offending field instead, which is what reveals their errors. Under `"aria"`
 * nothing refuses anything, so the submit itself is what tells a required field it is being asked
 * for. Counted rather than flagged, so a second attempt is a change the fields can see.
 */
const submitCount = shallowRef(0);

const onSubmit = () => {
  submitCount.value += 1;
};

// Held in computeds with a stable identity, so a field's watch on the errors fires once per
// server response rather than on every render of the form.
provideFormContext({
  submitCount,
  validationBehavior: computed(() => props.validationBehavior ?? "native"),
  validationErrors: computed(() => props.validationErrors ?? {}),
});

// No `data-slot`: React's form is a thin pass-through to the React Aria one, which renders none,
// and a hook the stylesheet never reads is not worth a divergence.
//
// Under `"aria"` the fields report through ARIA alone, so the browser's own blocking and its
// error bubbles are turned off. Under `"native"` they are exactly what does the work.
const isNoValidate = computed(() => props.validationBehavior === "aria" || undefined);
</script>

<template>
  <form :class="props.class" :novalidate="isNoValidate" @submit="onSubmit">
    <slot />
  </form>
</template>
