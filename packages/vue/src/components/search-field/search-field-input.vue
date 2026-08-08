<script setup lang="ts" vapor>
import type {SearchFieldInputProps} from "./search-field.types";

import {computed, shallowRef, watch} from "vue";

import {useInteractionStates} from "../../composables/use-interaction-states";
import {useTextFieldControlContext} from "../../composables/use-text-field";
import {dataAttr} from "../../utils/assertion";

import {useSearchFieldContext} from "./search-field.context";

const props = defineProps<SearchFieldInputProps>();

const emit = defineEmits<{
  change: [value: string];
  "update:value": [value: string];
}>();

const {slots} = useSearchFieldContext();
const control = useTextFieldControlContext();

const element = shallowRef<HTMLInputElement | null>(null);

const setElement = (next: unknown) => {
  element.value = next instanceof HTMLInputElement ? next : null;
  control?.registerElement(element.value);
};

const styles = computed(() => slots.value.input({class: props.class}));

// A prop set here wins over what the field supplies, which is how React merges context props
// too. Spreading the field's bag blindly would undo it: the bag carries every key it knows
// about, so an absent field placeholder arrives as `placeholder: undefined` and would remove
// one set on the control itself.
const attrs = computed(() => {
  const merged: Record<string, unknown> = {...control?.attrs.value};

  if (props.placeholder !== undefined) merged["placeholder"] = props.placeholder;
  if (props.value !== undefined) merged["value"] = props.value;

  return merged;
});

// The stylesheet keys hover and focus on these attributes as well as on the native
// pseudo-classes, so they are rendered here to match what React puts in the DOM.
const interaction = useInteractionStates({isDisabled: () => control?.isDisabled.value});

// Bumped on every input so the re-assert below runs even when the value the caller holds has
// not moved — which is the whole case worth handling.
const inputCount = shallowRef(0);

const onInput = (event: Event) => {
  control?.handlers.onInput(event);

  const next = (event.currentTarget as HTMLInputElement).value;

  emit("change", next);
  emit("update:value", next);

  if (props.value !== undefined) inputCount.value++;
};

/**
 * Put the text back to what the caller holds. A `value` set on the control makes the caller the
 * owner of it, and a caller that keeps it unchanged means the typing is rejected — but the
 * browser has already moved the text, and Vapor skips writing `value` when the bound value has
 * not changed, so nothing would put it back.
 *
 * Post-flush, because the value only settles once the listener that heard the change has
 * updated whatever holds it.
 */
watch(
  inputCount,
  () => {
    const el = element.value;

    if (el && props.value !== undefined && el.value !== props.value) el.value = props.value;
  },
  {flush: "post"},
);

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
    data-slot="search-field-input"
    v-bind="attrs"
    @blur="onBlur"
    @focus="onFocus"
    @input="onInput"
    @keydown="control?.handlers.onKeydown"
    @keyup="control?.handlers.onKeyup"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  />
</template>
