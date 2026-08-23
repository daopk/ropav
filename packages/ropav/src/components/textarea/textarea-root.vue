<script setup lang="ts" vapor>
import type { TextAreaRootProps } from "./textarea.types";

import { textAreaVariants } from "@ropav/styles";
import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { useTextFieldControlContext } from "../../composables/use-text-field";
import { dataAttr } from "../../utils/assertion";
import { useTextFieldContext } from "../textfield/textfield.context";

const props = withDefaults(defineProps<TextAreaRootProps>(), {
  fullWidth: undefined,
  variant: undefined,
});

// Both are optional: a bare `<TextArea>` outside any field is legal, exactly as in React.
const control = useTextFieldControlContext();
const textField = useTextFieldContext();

// Registering is what tells the field it is driving a textarea, which is how `type` and
// `pattern` drop out of the attributes it hands back.
const setElement = (element: unknown) => {
  control?.registerElement(element instanceof HTMLTextAreaElement ? element : null);
};

const resolvedVariant = computed(() => props.variant ?? textField?.variant.value);

const styles = computed(() =>
  textAreaVariants({
    class: props.class,
    fullWidth: props.fullWidth,
    variant: resolvedVariant.value,
  }),
);

// A prop set here wins over what the field supplies, matching how React merges context
// props. Spreading the field's bag blindly would undo it, since an absent field placeholder
// arrives as `placeholder: undefined`.
const attrs = computed(() => {
  const merged: Record<string, unknown> = { ...control?.attrs.value };

  if (props.placeholder !== undefined) merged["placeholder"] = props.placeholder;

  return merged;
});

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
  <textarea
    :ref="setElement"
    :class="styles"
    :data-disabled="dataAttr(control?.isDisabled.value)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(control?.isInvalid.value)"
    data-slot="textarea"
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
