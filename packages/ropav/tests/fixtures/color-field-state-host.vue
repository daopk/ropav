<script setup lang="ts" vapor>
import type {ColorFieldStateHostProps} from "./color-field.types";

import {useColorFieldState} from "@/composables/use-color-field-state";

// The composable has to run inside a component: it injects the form context, and `inject` outside
// a component instance returns `undefined` rather than the default.
//
// Every three-state prop declares `default: undefined`, because Vue casts an absent Boolean prop
// to `false` and a forwarded `false` is not the same as absent.
const props = withDefaults(defineProps<ColorFieldStateHostProps>(), {
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
});

props.onReady(
  useColorFieldState({
    defaultValue: () => props.defaultValue,
    isDisabled: () => props.isDisabled,
    isInvalid: () => props.isInvalid,
    isReadOnly: () => props.isReadOnly,
    isRequired: () => props.isRequired,
    name: () => props.name,
    onChange: props.onChange,
    validate: () => props.validate,
    validationBehavior: () => props.validationBehavior,
    value: () => props.value,
  }),
);
</script>

<template>
  <span data-slot="color-field-state-host" />
</template>
