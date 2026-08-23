<script setup lang="ts" vapor>
import type { InputRootProps } from "./input.types";

import { inputVariants } from "@ropav/styles";
import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { useTextFieldControlContext } from "../../composables/use-text-field";
import { dataAttr } from "../../utils/assertion";
import { useTextFieldContext } from "../textfield/textfield.context";

const props = withDefaults(defineProps<InputRootProps>(), {
  fullWidth: undefined,
  variant: undefined,
});

// Both are optional: a bare `<Input>` outside any field is legal, exactly as it is in React.
const control = useTextFieldControlContext();
const textField = useTextFieldContext();

const setElement = (element: unknown) => {
  control?.registerElement(element instanceof HTMLInputElement ? element : null);
};

// Named apart from the prop it resolves: an identifier matching a prop name resolves to the
// prop inside the template, which would drop the value coming from the field.
const resolvedVariant = computed(() => props.variant ?? textField?.variant.value);

const styles = computed(() =>
  inputVariants({
    class: props.class,
    fullWidth: props.fullWidth,
    variant: resolvedVariant.value,
  }),
);

// A prop set here wins over what the field supplies, which is how React merges context
// props too. Spreading the field's bag blindly would undo it: the bag carries every key it
// knows about, so an absent field placeholder arrives as `placeholder: undefined` and would
// remove one set on the control itself.
const attrs = computed(() => {
  const merged: Record<string, unknown> = { ...control?.attrs.value };

  if (props.placeholder !== undefined) merged["placeholder"] = props.placeholder;

  return merged;
});

// The stylesheet keys hover and focus on these attributes as well as on the native
// pseudo-classes, so they are rendered here to match what React puts in the DOM.
const interaction = useInteractionStates({ isDisabled: () => control?.isDisabled.value });

const onFocus = (event: FocusEvent) => {
  interaction.onFocus();
  control?.handlers.onFocus(event);
};

const onBlur = (event: FocusEvent) => {
  interaction.onBlur();
  control?.handlers.onBlur(event);
};
</script>

<template>
  <input
    :ref="setElement"
    :class="styles"
    :data-disabled="dataAttr(control?.isDisabled.value)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(control?.isInvalid.value)"
    data-slot="input"
    v-bind="attrs"
    @blur="onBlur"
    @focus="onFocus"
    @input="control?.handlers.onInput"
    @keydown="control?.handlers.onKeydown"
    @keyup="control?.handlers.onKeyup"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  />
</template>
