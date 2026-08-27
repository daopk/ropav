<script setup lang="ts" vapor>
import type { TextAreaRootProps } from "./textarea.types";

import { textAreaVariants } from "@ropav/styles";
import { computed, shallowRef, watch } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { useTextFieldControlContext } from "../../composables/use-text-field";
import { dataAttr } from "../../utils/assertion";
import { setFormValue } from "../../utils/form-value";
import { useTextFieldContext } from "../textfield/textfield.context";

const props = withDefaults(defineProps<TextAreaRootProps>(), {
  fullWidth: undefined,
  variant: undefined,
});

const emit = defineEmits<{
  change: [value: string];
  "update:value": [value: string];
}>();

// Both are optional: a bare `<TextArea>` outside any field is legal, exactly as in React.
const control = useTextFieldControlContext();
const textField = useTextFieldContext();

// Registering is what tells the field it is driving a textarea, which is how `type` and
// `pattern` drop out of the attributes it hands back.
const element = shallowRef<HTMLTextAreaElement | null>(null);

const setElement = (next: unknown) => {
  element.value = next instanceof HTMLTextAreaElement ? next : null;
  control?.registerElement(element.value);
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
  if (props.value !== undefined) merged["value"] = props.value;

  return merged;
});

const interaction = useInteractionStates({ isDisabled: () => control?.isDisabled.value });

// Bumped on every input so the re-assert below runs even when the value the caller holds has
// not moved — which is the whole case worth handling.
const inputCount = shallowRef(0);

// Chained by hand rather than spread: a listener reaching a vapor element through `v-bind` is
// re-attached on every render and can be dropped mid-dispatch.
const onInput = (event: Event) => {
  control?.handlers.onInput(event);

  const next = (event.currentTarget as HTMLTextAreaElement).value;

  emit("change", next);
  emit("update:value", next);

  if (props.value !== undefined) inputCount.value++;
};

/**
 * Put the text back to what the caller holds, reset source included. See the same watch in
 * `input-root.vue`, and {@link setFormValue}, for why this cannot be left to the binding — and note
 * that a textarea keeps its reset source in its children rather than in a `value` attribute.
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
 * flush that mounts the control.
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
    data-slot="textarea"
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
