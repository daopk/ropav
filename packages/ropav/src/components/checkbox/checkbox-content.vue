<script setup lang="ts" vapor>
import type { CheckboxContentProps, CheckboxContentSlotProps } from "./checkbox.types";

import { computed, shallowRef, watch, watchEffect } from "vue";

import { useFormReset } from "../../composables/use-form-reset";
import { useFormValidation, useValidationInput } from "../../composables/use-form-validation";
import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import { setFormChecked } from "../../utils/form-value";
import { visuallyHiddenStyle } from "../../utils/visually-hidden";

import { useCheckboxContext } from "./checkbox.context";

const props = defineProps<CheckboxContentProps>();

defineSlots<{ default?: (props: CheckboxContentSlotProps) => unknown }>();

const {
  ariaLabel,
  ariaLabelledby,
  defaultSelected,
  describedBy,
  form,
  id,
  isDisabled,
  isIndeterminate,
  isInvalid,
  isReadOnly,
  isRequired,
  isSelected,
  name,
  registerInput,
  setSelected,
  slots,
  validation,
  value,
} = useCheckboxContext();

const inputEl = shallowRef<HTMLInputElement | null>(null);

const setInputEl = (element: unknown) => {
  inputEl.value = element instanceof HTMLInputElement ? element : null;
};

useFormReset(inputEl, defaultSelected, setSelected);

/*
 * `checked` is a property with nothing behind it — the same situation as `indeterminate` below,
 * and for the same reason it has to be written here rather than bound. The difference is that this
 * one is load-bearing: it is the half a form reset restores from, so without it a real reset
 * unticks a box the state still says is selected, and the form submits nothing for it.
 *
 * In a watcher rather than in the `reset` listener because the browser drains microtasks between
 * dispatching `reset` and restoring the controls, so a write made from the listener lands too
 * early. See {@link setFormChecked}.
 */
watch([inputEl, isSelected], ([input, selected]) => setFormChecked(input, selected), {
  flush: "post",
  immediate: true,
});

// Hands the browser this checkbox's verdict and turns its answer back into state. No commit
// on blur: focus merely passing through an untouched checkbox is no reason to mark it.
useFormValidation(inputEl, validation);

// Inside a group, the group reads native validity off its items rather than owning a
// constraint of its own, so the input has to make itself findable.
useValidationInput(inputEl, registerInput);

// `indeterminate` is a property with no attribute behind it, so it cannot be bound in the
// template — it has to be written to the element after the flush that created it.
watchEffect(
  () => {
    if (inputEl.value) inputEl.value.indeterminate = isIndeterminate.value;
  },
  { flush: "post" },
);

// The stylesheet keys hover, press and focus on these attributes, so they have to be
// rendered rather than left to the native pseudo-classes — the focus ring in particular has
// no reachable pseudo-class branch. A read-only checkbox goes through `isPending`, which
// suppresses hover and press while leaving focus reachable: its input is still focusable,
// since only a disabled checkbox gets the `disabled` attribute.
const interaction = useInteractionStates({
  isDisabled: () => isDisabled.value,
  isPending: () => isReadOnly.value,
});

// Holding Space keeps a checkbox pressed, the same as holding the pointer down. The browser
// only reports it as a keydown on the input, so it is tracked here rather than by the
// pointer machinery.
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
// browser is the one enforcing validation. Under `"aria"` the same fact is announced instead.
const isNativeBehavior = computed(() => validation.validationBehavior.value === "native");
const resolvedRequired = computed(() => (isRequired.value && isNativeBehavior.value) || undefined);
const resolvedAriaRequired = computed(
  () => (isRequired.value && !isNativeBehavior.value) || undefined,
);

const onChange = (event: Event) => {
  const input = event.target as HTMLInputElement;

  if (!isReadOnly.value) setSelected(input.checked);

  // Re-assert the checked state the field actually holds. The browser has already flipped
  // the input, and nothing puts it back when the value did not move — a read-only checkbox,
  // or a controlled one whose owner declines the change — because no reactive dependency
  // changed and so nothing re-renders.
  input.checked = isSelected.value;
};

// Written even though a native input is already tabbable: Safari does not focus one unless an
// explicit tab index says so, which is the reason react-aria always sets it — `useToggle` picks
// it up from `useFocusable`. A disabled checkbox should not be reachable at all, so it gets none.
// Read-only is deliberately not a factor: only `isDisabled` takes the input out of the order.
const tabindex = computed(() => (isDisabled.value ? undefined : 0));
</script>

<template>
  <label
    :class="composeSlotClassName(slots.content, props.class)"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-indeterminate="dataAttr(isIndeterminate)"
    :data-invalid="dataAttr(isInvalid)"
    :data-pressed="dataAttr(isPressed)"
    :data-readonly="dataAttr(isReadOnly)"
    :data-required="dataAttr(isRequired)"
    :data-selected="dataAttr(isSelected)"
    data-slot="checkbox-content"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <span :style="visuallyHiddenStyle">
      <input
        :id="id"
        :ref="setInputEl"
        :aria-describedby="describedBy"
        :aria-invalid="isInvalid || undefined"
        :aria-label="ariaLabel"
        :aria-labelledby="ariaLabelledby"
        :aria-readonly="isReadOnly || undefined"
        :aria-required="resolvedAriaRequired"
        :checked="isSelected"
        :disabled="isDisabled || undefined"
        :form="form"
        :name="name"
        :required="resolvedRequired"
        :tabindex="tabindex"
        type="checkbox"
        :value="value"
        @blur="interaction.onBlur"
        @change="onChange"
        @focus="interaction.onFocus"
        @keydown="onKeydown"
        @keyup="onKeyup"
      />
    </span>
    <slot
      :is-disabled="isDisabled"
      :is-focus-visible="interaction.isFocusVisible.value"
      :is-focused="interaction.isFocused.value"
      :is-hovered="interaction.isHovered.value"
      :is-indeterminate="isIndeterminate"
      :is-invalid="isInvalid"
      :is-pressed="isPressed"
      :is-read-only="isReadOnly"
      :is-required="isRequired"
      :is-selected="isSelected"
    />
  </label>
</template>
