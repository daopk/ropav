<script setup lang="ts" vapor>
import type {NumberFieldFullHostProps} from "./number-field.types";

import {useNumberField} from "@/composables/use-number-field";

// The composable has to run inside a component: it injects the form context and provides field
// ids, and `inject` outside a component instance returns `undefined` rather than the default.
const props = withDefaults(defineProps<NumberFieldFullHostProps>(), {isInvalid: undefined});

const field = useNumberField({
  ariaLabel: () => props.ariaLabel,
  commitBehavior: () => props.commitBehavior,
  decrementAriaLabel: () => props.decrementAriaLabel,
  defaultValue: () => props.defaultValue,
  formatOptions: () => props.formatOptions,
  incrementAriaLabel: () => props.incrementAriaLabel,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  isWheelDisabled: () => props.isWheelDisabled,
  locale: () => props.locale,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  name: () => props.name,
  onChange: props.onChange,
  step: () => props.step,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

// `slot="increment"` / `slot="decrement"` are live CSS contracts, not leftovers of React Aria's
// slot system: `.number-field__group:has([slot="decrement"])` is what decides the grid columns.
// Bound from script because Vue 2 read a literal `slot` attribute as slot syntax and the linter
// still flags either spelling.
const incrementSlot = {slot: "increment"};
const decrementSlot = {slot: "decrement"};

const setElement = (element: unknown) => {
  field.registerElement(element instanceof HTMLInputElement ? element : null);
};

props.onReady(field);
</script>

<template>
  <div
    data-testid="group"
    v-bind="field.groupAttrs.value"
    @focusin="field.onFocusin"
    @focusout="field.onFocusout"
  >
    <button
      data-testid="decrement"
      :disabled="field.decrement.isDisabled.value || undefined"
      type="button"
      v-bind="{...decrementSlot, ...field.decrement.attrs.value}"
      @pointerdown="field.decrement.handlers.onPressStart('mouse')"
      @pointerleave="field.decrement.handlers.onPressEnd('mouse')"
      @pointerup="field.decrement.handlers.onPressUp('mouse')"
    >
      −
    </button>
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
    <button
      data-testid="increment"
      :disabled="field.increment.isDisabled.value || undefined"
      type="button"
      v-bind="{...incrementSlot, ...field.increment.attrs.value}"
      @pointerdown="field.increment.handlers.onPressStart('mouse')"
      @pointerleave="field.increment.handlers.onPressEnd('mouse')"
      @pointerup="field.increment.handlers.onPressUp('mouse')"
    >
      +
    </button>
  </div>
</template>
