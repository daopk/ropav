<script setup lang="ts" vapor>
import type {ColorFieldHostProps} from "./color-field.types";

import {useColorField} from "@/composables/use-color-field";

const props = withDefaults(defineProps<ColorFieldHostProps>(), {
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  isWheelDisabled: undefined,
});

const field = useColorField({
  ariaLabel: () => props.ariaLabel ?? "Color",
  defaultValue: () => props.defaultValue,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  isWheelDisabled: () => props.isWheelDisabled,
  name: () => props.name,
  onChange: props.onChange,
  placeholder: () => props.placeholder,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

const setElement = (element: unknown) => {
  field.registerElement(element instanceof HTMLInputElement ? element : null);
};

props.onReady(field);
</script>

<template>
  <form v-if="$props.withForm" data-testid="form">
    <input
      :ref="setElement"
      data-testid="input"
      v-bind="field.attrs.value"
      @blur="field.handlers.onBlur"
      @focus="field.handlers.onFocus"
      @input="field.handlers.onInput"
      @keydown="field.handlers.onKeydown"
      @keyup="field.handlers.onKeyup"
    />
    <button data-testid="reset" type="reset">Reset</button>
  </form>
  <input
    v-else
    :ref="setElement"
    data-testid="input"
    v-bind="field.attrs.value"
    @blur="field.handlers.onBlur"
    @focus="field.handlers.onFocus"
    @input="field.handlers.onInput"
    @keydown="field.handlers.onKeydown"
    @keyup="field.handlers.onKeyup"
  />
</template>
