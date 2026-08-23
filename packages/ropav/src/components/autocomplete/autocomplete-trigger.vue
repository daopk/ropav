<script setup lang="ts" vapor>
import type { AutocompleteTriggerProps, AutocompleteTriggerSlotProps } from "./autocomplete.types";

import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";

import { useAutocompleteContext } from "./autocomplete.context";

// `isDisabled` declares an explicit `undefined` default so an absent prop falls back to the
// autocomplete's own state rather than reading as an explicit `false`.
const props = withDefaults(defineProps<AutocompleteTriggerProps>(), { isDisabled: undefined });

defineSlots<{ default?: (props: AutocompleteTriggerSlotProps) => unknown }>();

const {
  clearButtonElement,
  isDisabled: rootDisabled,
  select,
  setTriggerElement,
  slots,
  state,
} = useAutocompleteContext();

const resolvedIsDisabled = computed(() => props.isDisabled ?? rootDisabled.value);

const { isFocusVisible, isFocused, isHovered, onBlur, onFocus, onPointerenter, onPointerleave } =
  useInteractionStates({ isDisabled: () => resolvedIsDisabled.value });

const styles = computed(() => slots.value.trigger({ class: props.class }));

// A named callback rather than a string `ref`, which `vue-tsc` does not count as a read.
const setElement = (element: unknown) => {
  setTriggerElement((element as HTMLElement | null) ?? null);
};

/**
 * A press anywhere in the field opens the popover — except on the clear button.
 *
 * That button sits inside the group, so its click bubbles through here; toggling on it would
 * reopen the popover the same gesture just emptied the selection in.
 */
const onClick = (event: MouseEvent) => {
  if (resolvedIsDisabled.value) return;
  if (event.target instanceof Node && clearButtonElement.value?.contains(event.target)) return;

  state.toggle();
};
</script>

<template>
  <div
    :ref="setElement"
    :class="styles"
    :data-disabled="dataAttr(resolvedIsDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focus-within="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-invalid="dataAttr(select.isInvalid.value)"
    :data-open="dataAttr(state.isOpen.value)"
    data-slot="autocomplete-trigger"
    role="group"
    @click="onClick"
    @focusin="onFocus"
    @focusout="onBlur"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <slot
      :is-disabled="resolvedIsDisabled"
      :is-focus-within="isFocused"
      :is-hovered="isHovered"
      :is-invalid="select.isInvalid.value"
    />
  </div>
</template>
