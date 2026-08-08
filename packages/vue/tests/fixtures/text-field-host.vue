<script setup lang="ts" vapor>
import type {TextFieldHostProps} from "./text-field.types";

import {useTextField} from "@/composables/use-text-field";

// Every three-state boolean declares an explicit `undefined`: a cast `false` would read as a
// caller claiming the field valid, which silences the whole validation layer.
const props = withDefaults(defineProps<TextFieldHostProps>(), {
  autoFocus: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  skipFormReset: undefined,
});

const field = useTextField({
  ariaDescribedby: () => props.ariaDescribedby,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  autoFocus: () => props.autoFocus,
  defaultValue: () => props.defaultValue,
  id: () => props.id,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  name: () => props.name,
  onChange: (value) => props.onChange?.(value),
  onFocusChange: (isFocused) => props.onFocusChange?.(isFocused),
  onKeydown: (event) => props.onKeydownForward?.(event),
  onKeyup: (event) => props.onKeyupForward?.(event),
  pattern: () => props.pattern,
  skipFormReset: props.skipFormReset,
  type: () => props.type,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  validationState: props.validationState,
  value: () => props.value,
});

props.onReady?.(field);

const setControl = (element: unknown) => {
  field.registerElement(
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element : null,
  );
};
</script>

<template>
  <textarea
    v-if="props.elementType === 'textarea'"
    :ref="setControl"
    v-bind="field.attrs.value"
    @blur="field.handlers.onBlur"
    @focus="field.handlers.onFocus"
    @input="field.handlers.onInput"
    @keydown="field.handlers.onKeydown"
    @keyup="field.handlers.onKeyup"
  />
  <input
    v-else
    :ref="setControl"
    v-bind="field.attrs.value"
    @blur="field.handlers.onBlur"
    @focus="field.handlers.onFocus"
    @input="field.handlers.onInput"
    @keydown="field.handlers.onKeydown"
    @keyup="field.handlers.onKeyup"
  />
</template>
