<script setup lang="ts" vapor>
import type {SwitchContentProps, SwitchContentSlotProps} from "./switch.types";

import {computed, shallowRef} from "vue";

import {useFormReset} from "../../composables/use-form-reset";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";
import {visuallyHiddenStyle} from "../../utils/visually-hidden";

import {useSwitchContext} from "./switch.context";

const props = defineProps<SwitchContentProps>();

defineSlots<{default?: (props: SwitchContentSlotProps) => unknown}>();

const {
  ariaLabel,
  ariaLabelledby,
  defaultSelected,
  describedBy,
  form,
  id,
  isDisabled,
  isInvalid,
  isReadOnly,
  isRequired,
  isSelected,
  name,
  setSelected,
  slots,
  value,
} = useSwitchContext();

const inputEl = shallowRef<HTMLInputElement | null>(null);

const setInputEl = (element: unknown) => {
  inputEl.value = element instanceof HTMLInputElement ? element : null;
};

useFormReset(inputEl, defaultSelected, setSelected);

// The stylesheet keys hover, press and focus on these attributes, so they have to be
// rendered rather than left to the native pseudo-classes — the focus ring in particular has
// no reachable pseudo-class branch. A read-only switch goes through `isPending`, which
// suppresses hover and press while leaving focus reachable: its input is still focusable,
// since only a disabled switch gets the `disabled` attribute.
const interaction = useInteractionStates({
  isDisabled: () => isDisabled.value,
  isPending: () => isReadOnly.value,
});

// Holding Space keeps a switch pressed, the same as holding the pointer down. The browser
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

const onChange = (event: Event) => {
  const input = event.target as HTMLInputElement;

  if (!isReadOnly.value) setSelected(input.checked);

  // Re-assert the checked state the field actually holds. The browser has already flipped
  // the input, and nothing puts it back when the value did not move — a read-only switch, or
  // a controlled one whose owner declines the change — because no reactive dependency
  // changed and so nothing re-renders.
  input.checked = isSelected.value;
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
    data-slot="switch-content"
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
        :checked="isSelected"
        :disabled="isDisabled || undefined"
        :form="form"
        :name="name"
        :required="isRequired || undefined"
        role="switch"
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
      :is-invalid="isInvalid"
      :is-pressed="isPressed"
      :is-read-only="isReadOnly"
      :is-required="isRequired"
      :is-selected="isSelected"
    />
  </label>
</template>
