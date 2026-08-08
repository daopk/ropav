<script setup lang="ts" vapor>
import type {FormValidationHostProps} from "./form-validation.types";
import type {ValidationFunction} from "@/composables/use-form-validation-state";

import {useFormValidationState} from "@/composables/use-form-validation-state";

// `isInvalid` declares an explicit `undefined` default because it is a three-state prop:
// absent means "no claim", while `false` is an active claim of validity. Vue casts an
// absent boolean to `false`, which would pin the field valid and hide every other source.
const props = withDefaults(defineProps<FormValidationHostProps>(), {isInvalid: undefined});

const state = useFormValidationState({
  builtinValidation: () => props.builtinValidation,
  isInvalid: () => props.isInvalid,
  name: () => props.name,
  validate: () => props.validate as ValidationFunction<unknown> | undefined,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

props.onReady?.(state);
</script>

<template>
  <div>
    <span data-testid="display-invalid">{{ String(state.displayValidation.value.isInvalid) }}</span>
    <span data-testid="display-errors">{{
      state.displayValidation.value.validationErrors.join("|")
    }}</span>
    <span data-testid="realtime-invalid">{{
      String(state.realtimeValidation.value.isInvalid)
    }}</span>
    <span data-testid="realtime-errors">{{
      state.realtimeValidation.value.validationErrors.join("|")
    }}</span>
    <span data-testid="behavior">{{ state.validationBehavior.value }}</span>
  </div>
</template>
