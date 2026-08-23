<script setup lang="ts" vapor>
import type { ModalTriggerProps } from "./modal.types";

import { computed } from "vue";

import { composePressResponder, usePressResponder } from "../../composables/press-responder";
import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";

import { useModalContext } from "./modal.context";

const props = defineProps<ModalTriggerProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useModalContext();

// Supplied by the modal root, which is what makes this a trigger rather than a plain box.
const responder = usePressResponder();

const styles = computed(() => slots.value.trigger({ class: props.class }));

const setElement = (element: unknown) => {
  responder?.registerElement((element as HTMLElement | null) ?? null);
};

// The stylesheet keys the focus ring on the attribute, and a `div` has no pseudo-class branch it
// could fall back to.
const { isFocusVisible, onBlur, onFocus } = useInteractionStates();

// A `div` is not focusable on its own, and this one has to be: the modal is opened from it by
// keyboard as well as by pointer.
//
// Listeners are attached here rather than spread with `v-bind`, which in vapor re-attaches them
// on every render — see `composePressResponder`.
const press = composePressResponder(responder);
</script>

<template>
  <div
    :ref="setElement"
    :class="styles"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-pressed="dataAttr(responder?.isPressed.value)"
    data-slot="modal-trigger"
    role="button"
    tabindex="0"
    v-bind="responder?.attrs.value"
    @blur="onBlur"
    @click="press.onClick"
    @dragstart="press.onDragstart"
    @focus="onFocus"
    @keydown="press.onKeydown"
    @mousedown="press.onMousedown"
    @pointerdown="press.onPointerdown"
    @pointerenter="press.onPointerenter"
    @pointerleave="press.onPointerleave"
    @pointerup="press.onPointerup"
  >
    <slot />
  </div>
</template>
