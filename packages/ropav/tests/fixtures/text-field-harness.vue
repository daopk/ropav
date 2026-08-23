<script setup lang="ts" vapor>
import type {TextFieldHarnessProps} from "./text-field.types";

import TextFieldHost from "./text-field-host.vue";

// A separate component from the host, because the form the field resets with has to be an
// ancestor of the control rather than something the test wraps around it afterwards.
//
// The three-state booleans need the same explicit `undefined` defaults the host declares.
// Vue casts an absent boolean prop to `false`, and forwarding that `false` on would read as a
// caller pinning the field — `isInvalid: false` in particular claims the value is valid and
// shadows `validate` entirely, which silently empties out every validation test.
const props = withDefaults(defineProps<TextFieldHarnessProps>(), {
  autoFocus: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  skipFormReset: undefined,
});

// Declared in the template rather than attached by the test: `useFormReset` attaches its own
// listener after the render that creates the form, and listeners on one element run in the
// order they were added, so a listener the test adds afterwards could never cancel in time.
const onReset = (event: Event) => {
  if (props.cancelReset) event.preventDefault();
};
</script>

<template>
  <form v-if="props.withForm" @reset="onReset">
    <TextFieldHost v-bind="props" />
  </form>
  <TextFieldHost v-else v-bind="props" />
</template>
