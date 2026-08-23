<script setup lang="ts" vapor>
import type {ColorChannelFieldHostProps} from "./color-field.types";

import {useColorChannelField} from "@/composables/use-color-channel-field";

const props = withDefaults(defineProps<ColorChannelFieldHostProps>(), {
  isDisabled: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  isWheelDisabled: undefined,
});

const field = useColorChannelField({
  ariaLabel: () => props.ariaLabel,
  channel: () => props.channel ?? "red",
  colorSpace: () => props.colorSpace,
  defaultValue: () => props.defaultValue,
  isDisabled: () => props.isDisabled,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  isWheelDisabled: () => props.isWheelDisabled,
  locale: () => props.locale ?? "en-US",
  onChange: props.onChange,
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
      @blur="field.onBlur"
      @focus="field.onFocus"
      @input="field.onInput"
      @keydown="field.onKeydown"
      @keyup="field.onKeyup"
      @paste="field.onPaste"
    />
    <button data-testid="reset" type="reset">Reset</button>
  </form>
  <input
    v-else
    :ref="setElement"
    data-testid="input"
    v-bind="field.attrs.value"
    @blur="field.onBlur"
    @focus="field.onFocus"
    @input="field.onInput"
    @keydown="field.onKeydown"
    @keyup="field.onKeyup"
    @paste="field.onPaste"
  />
</template>
