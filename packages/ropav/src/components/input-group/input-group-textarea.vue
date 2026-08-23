<script setup lang="ts" vapor>
import type { InputGroupTextAreaProps } from "./input-group.types";

import { computed, shallowRef, watch } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { useTextFieldControlContext } from "../../composables/use-text-field";
import { dataAttr } from "../../utils/assertion";
import { setFormValue } from "../../utils/form-value";

import { useInputGroupContext } from "./input-group.context";

const props = defineProps<InputGroupTextAreaProps>();

const emit = defineEmits<{
  change: [value: string];
  "update:value": [value: string];
}>();

const { slots } = useInputGroupContext();

// Optional: a group can hold a control without a field around it, exactly as in React.
const control = useTextFieldControlContext();

const element = shallowRef<HTMLTextAreaElement | null>(null);

const setElement = (next: unknown) => {
  element.value = next instanceof HTMLTextAreaElement ? next : null;
  control?.registerElement(element.value);
};

const styles = computed(() => slots.value.input({ class: props.class }));

// A prop set here wins over what the field supplies, which is how React merges context props
// too. Spreading the field's bag blindly would undo it: the bag carries every key it knows
// about, so an absent field placeholder arrives as `placeholder: undefined` and would remove
// one set on the control itself.
const attrs = computed(() => {
  const merged: Record<string, unknown> = { ...control?.attrs.value };

  if (props.placeholder !== undefined) merged["placeholder"] = props.placeholder;
  if (props.value !== undefined) merged["value"] = props.value;

  return merged;
});

// The stylesheet keys hover and focus on these attributes as well as on the native
// pseudo-classes, so they are rendered here to match what React puts in the DOM.
const interaction = useInteractionStates({ isDisabled: () => control?.isDisabled.value });

// Bumped on every input so the re-assert below runs even when the value the caller holds has
// not moved — which is the whole case worth handling.
const inputCount = shallowRef(0);

const onInput = (event: Event) => {
  control?.handlers.onInput(event);

  const next = (event.currentTarget as HTMLTextAreaElement).value;

  emit("change", next);
  emit("update:value", next);

  if (props.value !== undefined) inputCount.value++;
};

/**
 * Put the text back to what the caller holds, reset source included. A `value` set on the control
 * makes the caller the owner of it, and a caller that keeps it unchanged means the typing is
 * rejected — but the browser has already moved the text, and Vapor skips writing `value` when the
 * bound value has not changed, so nothing would put it back.
 *
 * Post-flush, because the value only settles once the listener that heard the change has updated
 * whatever holds it. `immediate`, and with the element in the dependencies, because the reset
 * source has to be there before a reset rather than after the first keystroke — `inputCount` alone
 * never fires on a control nobody has typed into. See {@link setFormValue}.
 */
watch(
  [element, () => props.value, inputCount],
  ([el, pinned]) => {
    if (pinned === undefined) return;

    setFormValue(el, pinned);
  },
  { flush: "post", immediate: true },
);

/*
 * Told to the field synchronously, before any post-flush write can happen: the field keeps the
 * element in step with its own state, and the two would otherwise fight over one value on the
 * flush that mounts the control. `setFormValue` above is then the only thing writing this element,
 * reset source included.
 */
watch(
  () => props.value !== undefined,
  (owned) => control?.setValueOwned(owned),
  { immediate: true },
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
  <textarea
    :ref="setElement"
    :class="styles"
    :data-disabled="dataAttr(control?.isDisabled.value)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(control?.isInvalid.value)"
    data-slot="input-group-textarea"
    v-bind="attrs"
    @blur="onBlur"
    @focus="onFocus"
    @input="onInput"
    @keydown="control?.handlers.onKeydown"
    @keyup="control?.handlers.onKeyup"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  ></textarea>
</template>
