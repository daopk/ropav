<script setup lang="ts" vapor>
import type {FormValidationInputProps} from "./form-validation-input.types";

import {computed} from "vue";

import {provideFormContext} from "@/composables/use-form-validation-state";

import FormValidationInputHost from "./form-validation-input-host.vue";

// A component only sees what an *ancestor* provided, never its own provides, so the form
// context has to live one level above the field that injects it.
const props = withDefaults(defineProps<FormValidationInputProps>(), {isInvalid: undefined});

if (props.withForm) {
  provideFormContext({
    validationBehavior: computed(() => "native"),
    validationErrors: computed(() => props.validationErrors ?? {}),
  });
}
</script>

<template>
  <FormValidationInputHost
    :commit-on-blur="props.commitOnBlur"
    :is-disabled="props.isDisabled"
    :is-invalid="props.isInvalid"
    :is-required="props.isRequired"
    :name="props.name"
    :on-focus-field="props.onFocusField"
    :on-input-element="props.onInputElement"
    :on-ready="props.onReady"
    :prevent-reset="props.preventReset"
    :title="props.title"
    :validate="props.validate"
    :validation-behavior="props.validationBehavior"
    :with-leading-input="props.withLeadingInput"
  />
</template>
