<script setup lang="ts" vapor>
import type { FormValidationHarnessProps } from "./form-validation.types";

import { computed } from "vue";

import { provideFormContext } from "@/composables/use-form-validation-state";

import FormValidationHost from "./form-validation-host.vue";

// The context has to come from an ancestor, so the harness is a component of its own rather
// than something the test assembles — `inject` outside a component returns `undefined`.
const props = withDefaults(defineProps<FormValidationHarnessProps>(), { isInvalid: undefined });

if (props.withForm) {
  provideFormContext({
    submitCount: computed(() => props.submitCount ?? 0),
    validationBehavior: computed(() => props.formValidationBehavior ?? "native"),
    validationErrors: computed(() => props.validationErrors ?? {}),
  });
}
</script>

<template>
  <FormValidationHost
    :builtin-validation="props.builtinValidation"
    :is-invalid="props.isInvalid"
    :is-required="props.isRequired"
    :name="props.name"
    :on-ready="props.onReady"
    :required-control="props.requiredControl"
    :validate="props.validate"
    :validation-behavior="props.validationBehavior"
    :validation-state="props.validationState"
    :value="props.value"
  />
</template>
