<script setup lang="ts" vapor>
import type {SelectTriggerProps} from "./select.types";

import {computed} from "vue";

import {composePressResponder, usePressResponder} from "../../composables/press-responder";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";

import {useSelectContext} from "./select.context";

const props = defineProps<SelectTriggerProps>();

defineSlots<{default?: () => unknown}>();

const {select, slots, state} = useSelectContext();

// Supplied by the select root, which is what makes this button open a listbox.
const responder = usePressResponder();

const {isFocusVisible, isFocused, isHovered, onBlur, onFocus, onPointerenter, onPointerleave} =
  useInteractionStates({isDisabled: () => Boolean(select.triggerAttributes.value["disabled"])});

const styles = computed(() => slots.value.trigger({class: props.class}));

const setElement = (element: unknown) => {
  responder?.registerElement((element as HTMLElement | null) ?? null);
};

// Listeners are attached here rather than spread with `v-bind`, which in vapor re-attaches them
// on every render — a handler must never travel through `v-bind`.
const press = composePressResponder(responder);

// The select tracks focus for itself as well, because a blur while the popover is open is not a
// blur out of the select at all.
const onTriggerFocus = () => {
  onFocus();
  select.onFocus();
};

const onTriggerBlur = () => {
  onBlur();
  select.onBlur();
};

/**
 * The select's own keys come first, and the press responder only sees what is left.
 *
 * `useSelect` claims the inline arrows and the type-to-choose characters while the popover is
 * shut, and hands everything else — Enter, Space, ArrowDown, ArrowUp — on to the responder that
 * opens the popover.
 */
const onKeydown = (event: KeyboardEvent) => {
  select.onKeydown(event);
};
</script>

<template>
  <button
    :ref="setElement"
    :class="styles"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-open="dataAttr(state.isOpen.value)"
    :data-pressed="dataAttr(responder?.isPressed.value)"
    data-slot="select-trigger"
    tabindex="0"
    v-bind="select.triggerAttributes.value"
    @blur="onTriggerBlur"
    @click="press.onClick"
    @dragstart="press.onDragstart"
    @focus="onTriggerFocus"
    @keydown="onKeydown"
    @keydown.capture="select.onKeydownCapture"
    @mousedown="press.onMousedown"
    @pointerdown="press.onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
    @pointerup="press.onPointerup"
  >
    <slot />
  </button>
</template>
