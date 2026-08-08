<script setup lang="ts" vapor>
import type {NumberFieldStepperButtonProps} from "./number-field.types";

import {computed} from "vue";

import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {IconMinus} from "../icons";

import {useNumberFieldContext} from "./number-field.context";

const props = defineProps<NumberFieldStepperButtonProps>();

defineSlots<{default?: () => unknown}>();

const {decrement, field, slots} = useNumberFieldContext();

const styles = computed(() => slots.value.decrementButton({class: props.class}));

/**
 * `slot="decrement"` is a live CSS contract, not a leftover of React Aria's slot system:
 * `.number-field__group:has([slot="decrement"])` is what gives the group a column for this
 * button, so dropping it collapses the layout in silence.
 *
 * Bound from here rather than written in the template because Vue 2 read a literal `slot`
 * attribute as slot syntax, and the linter still flags either spelling. The vapor compiler passes
 * both straight through — measured in the DOM.
 */
const decrementSlot = {slot: "decrement"};

const attrs = computed(() => ({...decrementSlot, ...decrement.attrs.value}));

// The stylesheet scales the button down while it is held, keyed on `data-pressed` as well as on
// `:active`, so the press has to be reported here.
const interaction = useInteractionStates({isDisabled: decrement.isDisabled});

/**
 * Where focus goes when a stepper is pressed.
 *
 * Focus already in the field stays put. Otherwise a mouse hands it to the input, because that is
 * where typing should continue — but a touch or a screen reader keeps it on the button, so the
 * software keyboard does not slide up over the thing being pressed and the screen reader cursor
 * does not jump away mid-gesture.
 */
const takeFocus = (event: PointerEvent) => {
  const input = field.element.value;

  if (input && document.activeElement === input) return;

  if (event.pointerType === "mouse") {
    input?.focus();

    return;
  }

  (event.currentTarget as HTMLElement | null)?.focus();
};

const onPointerdown = (event: PointerEvent) => {
  // Stops the browser moving focus to the button, which it would otherwise do *after* this
  // handler has put focus where it belongs. This is what react-aria's `preventFocusOnPress`
  // does, and without it a mouse press lands focus on the stepper instead of the input.
  event.preventDefault();

  interaction.onPointerdown(event);
  takeFocus(event);
  decrement.handlers.onPressStart(event.pointerType);
};

// Both, in this order: a touch takes its step on the release, and only a release that landed on
// the button counts as one.
const onPointerup = (event: PointerEvent) => {
  decrement.handlers.onPressUp(event.pointerType);
  decrement.handlers.onPressEnd(event.pointerType);
};

// A pointer sliding off ends the press without ever having landed, which is how a scroll gesture
// that began on the button is told apart from a press.
const onPointerleave = (event: PointerEvent) => {
  interaction.onPointerleave();
  decrement.handlers.onPressEnd(event.pointerType);
};

const onPointercancel = (event: PointerEvent) => {
  decrement.handlers.onPressEnd(event.pointerType);
};
</script>

<template>
  <button
    :class="styles"
    :data-disabled="dataAttr(decrement.isDisabled.value)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-pressed="dataAttr(interaction.isPressed.value)"
    data-slot="number-field-decrement-button"
    :disabled="decrement.isDisabled.value || undefined"
    type="button"
    v-bind="attrs"
    @blur="interaction.onBlur"
    @focus="interaction.onFocus"
    @pointercancel="onPointercancel"
    @pointerdown="onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="onPointerleave"
    @pointerup="onPointerup"
  >
    <slot>
      <IconMinus data-slot="number-field-decrement-button-icon" />
    </slot>
  </button>
</template>
