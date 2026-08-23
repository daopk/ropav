<script setup lang="ts" vapor>
import type { RadioContentProps, RadioContentSlotProps } from "./radio.types";

import { computed, shallowRef, watch } from "vue";

import { useFormReset } from "../../composables/use-form-reset";
import { useFormValidation } from "../../composables/use-form-validation";
import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import { setFormChecked } from "../../utils/form-value";
import { visuallyHiddenStyle } from "../../utils/visually-hidden";
import { useRadioGroupContext } from "../radio-group/radio-group.context";

import { useRadioContext } from "./radio.context";

const props = defineProps<RadioContentProps>();

defineSlots<{ default?: (props: RadioContentSlotProps) => unknown }>();

const { state } = useRadioGroupContext();

const {
  ariaLabel,
  ariaLabelledby,
  describedBy,
  form,
  id,
  isDisabled,
  isInvalid,
  isReadOnly,
  isRequired,
  isSelected,
  name,
  onFocus,
  select,
  slots,
  tabIndex,
  value,
} = useRadioContext();

const inputEl = shallowRef<HTMLInputElement | null>(null);

const setInputEl = (element: unknown) => {
  inputEl.value = element instanceof HTMLInputElement ? element : null;
};

// The whole group goes back to its starting selection, so every radio resets to the group's
// default rather than to a value of its own.
useFormReset(inputEl, state.defaultSelectedValue, state.setSelectedValue);

/*
 * Every radio keeps its own reset source, and the group falls out of that: they all mirror the same
 * selected value, so exactly one of them settles on `true` in the same flush and the browser — which
 * restores each radio independently from this half — puts the group back intact. No walk needed
 * here, unlike `restoreSelection` below, which has a different job.
 *
 * In a watcher rather than in the `reset` listener because the browser drains microtasks between
 * dispatching `reset` and restoring the controls, so a write made from the listener lands too
 * early. See {@link setFormChecked}.
 */
watch([inputEl, isSelected], ([input, selected]) => setFormChecked(input, selected), {
  flush: "post",
  immediate: true,
});

// Validity belongs to the group, and every radio in it reports the same verdict, so each
// input wires the browser up to the same state.
useFormValidation(inputEl, state.validation);

// The stylesheet keys hover, press and focus on these attributes, so they have to be
// rendered rather than left to the native pseudo-classes — the focus ring in particular has
// no reachable pseudo-class branch. A read-only radio goes through `isPending`, which
// suppresses hover and press while leaving focus reachable.
const interaction = useInteractionStates({
  isDisabled: () => isDisabled.value,
  isPending: () => isReadOnly.value,
});

// Holding Space keeps a radio pressed, the same as holding the pointer down. The browser
// only reports it as a keydown on the input, so it is tracked here.
const isSpaceHeld = shallowRef(false);

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== " " || isDisabled.value || isReadOnly.value) return;

  isSpaceHeld.value = true;
};

const onKeyup = (event: KeyboardEvent) => {
  if (event.key !== " ") return;

  isSpaceHeld.value = false;
};

const isPressed = computed(() => interaction.isPressed.value || isSpaceHeld.value);

// `required` is what makes the browser refuse the submit, so it is only rendered when the
// browser is the one enforcing validation. Under `"aria"` the group announces it instead.
const isNativeBehavior = computed(() => state.validation.validationBehavior.value === "native");
const resolvedRequired = computed(() => (isRequired.value && isNativeBehavior.value) || undefined);

/**
 * Put the whole named group back to the selection the state actually holds.
 *
 * A checkbox only has to re-assert itself, but choosing a radio also *unchecks* a sibling,
 * so restoring the clicked input alone would leave the group with nothing selected. Radios
 * share a name, so checking the right one unchecks the rest on its own.
 */
const restoreSelection = (input: HTMLInputElement) => {
  const root = input.getRootNode() as Document | ShadowRoot;
  const selected = state.selectedValue.value;

  for (const radio of Array.from(root.querySelectorAll<HTMLInputElement>('input[type="radio"]'))) {
    if (radio.name !== name.value) continue;

    setFormChecked(radio, radio.value === selected);
  }
};

const onChange = (event: Event) => {
  const input = event.target as HTMLInputElement;

  if (!isReadOnly.value) select();

  // The browser has already moved the selection, and nothing puts it back when the value did
  // not move — a read-only group, or a controlled one whose owner declines the change —
  // because no reactive dependency changed and so nothing re-renders.
  if (input.checked !== isSelected.value) restoreSelection(input);
};

const onInputFocus = () => {
  onFocus();
  interaction.onFocus();
};
</script>

<template>
  <label
    :class="composeSlotClassName(slots.content, props.class)"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(isInvalid)"
    :data-pressed="dataAttr(isPressed)"
    :data-readonly="dataAttr(isReadOnly)"
    :data-required="dataAttr(isRequired)"
    :data-selected="dataAttr(isSelected)"
    data-slot="radio-content"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <span :style="visuallyHiddenStyle">
      <input
        :id="id"
        :ref="setInputEl"
        :aria-describedby="describedBy"
        :aria-label="ariaLabel"
        :aria-labelledby="ariaLabelledby"
        :checked="isSelected"
        :disabled="isDisabled || undefined"
        :form="form"
        :name="name"
        :required="resolvedRequired"
        :tabindex="tabIndex"
        type="radio"
        :value="value"
        @blur="interaction.onBlur"
        @change="onChange"
        @focus="onInputFocus"
        @keydown="onKeydown"
        @keyup="onKeyup"
      />
    </span>
    <slot
      :is-disabled="isDisabled"
      :is-focus-visible="interaction.isFocusVisible.value"
      :is-focused="interaction.isFocused.value"
      :is-hovered="interaction.isHovered.value"
      :is-invalid="isInvalid"
      :is-pressed="isPressed"
      :is-read-only="isReadOnly"
      :is-required="isRequired"
      :is-selected="isSelected"
    />
  </label>
</template>
