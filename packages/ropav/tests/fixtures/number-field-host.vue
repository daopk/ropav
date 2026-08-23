<script setup lang="ts" vapor>
import type {NumberFieldHostProps} from "./number-field.types";

import {useNumberFieldState} from "@/composables/use-number-field-state";

// The composable has to run inside a component: `useFormValidationState` injects the form
// context, and `inject` outside a component instance returns `undefined` rather than the default.
const props = withDefaults(defineProps<NumberFieldHostProps>(), {isInvalid: undefined});

const state = useNumberFieldState({
  commitBehavior: () => props.commitBehavior,
  defaultValue: () => props.defaultValue,
  formatOptions: () => props.formatOptions,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  locale: () => props.locale,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  name: () => props.name,
  onChange: props.onChange,
  step: () => props.step,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

props.onReady(state);
</script>

<template>
  <span data-testid="number-field-host">{{ state.inputValue.value }}</span>
</template>
