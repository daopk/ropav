<script setup lang="ts" vapor>
import type {NumberFieldInputProps} from "./number-field.types";

import {computed} from "vue";

import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";

import {useNumberFieldContext} from "./number-field.context";

const props = defineProps<NumberFieldInputProps>();

const {field, slots} = useNumberFieldContext();

const setElement = (element: unknown) => {
  field.registerElement(element instanceof HTMLInputElement ? element : null);
};

const styles = computed(() => slots.value.input({class: props.class}));

const attrs = computed(() => {
  const merged: Record<string, unknown> = {...field.attrs.value};

  if (props.placeholder !== undefined) merged["placeholder"] = props.placeholder;

  return merged;
});

// The stylesheet keys hover and focus on these attributes as well as on the native
// pseudo-classes, so they are rendered here to match what React puts in the DOM.
const interaction = useInteractionStates({isDisabled: field.isDisabled});

const onFocus = (event: FocusEvent) => {
  interaction.onFocus();
  field.onFocus(event);
};

const onBlur = (event: FocusEvent) => {
  interaction.onBlur();
  field.onBlur(event);
};
</script>

<template>
  <input
    :ref="setElement"
    :class="styles"
    :data-disabled="dataAttr(field.isDisabled.value)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(field.isInvalid.value)"
    data-slot="number-field-input"
    v-bind="attrs"
    @blur="onBlur"
    @focus="onFocus"
    @input="field.onInput"
    @keydown="field.onKeydown"
    @keyup="field.onKeyup"
    @paste="field.onPaste"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  />
</template>
