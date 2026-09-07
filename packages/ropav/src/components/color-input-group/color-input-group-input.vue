<script setup lang="ts" vapor>
import type { ColorInputGroupInputProps } from "./color-input-group.types";

import { computed, shallowRef } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";

import { useColorInputGroupControlContext } from "./color-input-group.context";

const props = defineProps<ColorInputGroupInputProps>();

// Optional: a group can hold a control without a field around it, exactly as in React.
const control = useColorInputGroupControlContext();

const element = shallowRef<HTMLInputElement | null>(null);

const setElement = (next: unknown) => {
  element.value = next instanceof HTMLInputElement ? next : null;
  control?.registerElement(element.value);
};

// A prop set here wins over what the field supplies, which is how React merges context props
// too. Spreading the field's bag blindly would undo it: the bag carries every key it knows
// about, so an absent field placeholder arrives as `placeholder: undefined` and would remove one
// set on the control itself.
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

// Not narrowed to the branch that has one: a hex field wires no paste handler, and a `@paste`
// bound to `undefined` is simply not attached.
const onPaste = (event: ClipboardEvent) => {
  control?.handlers.onPaste?.(event);
};
</script>

<template>
  <input
    :ref="setElement"
    :class="['rp-color-input-group__input', props.class]"
    :data-disabled="dataAttr(control?.isDisabled.value)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(control?.isInvalid.value)"
    data-slot="color-input-group-input"
    v-bind="attrs"
    @blur="onBlur"
    @focus="onFocus"
    @input="control?.handlers.onInput"
    @keydown="control?.handlers.onKeydown"
    @keyup="control?.handlers.onKeyup"
    @paste="onPaste"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  />
</template>
