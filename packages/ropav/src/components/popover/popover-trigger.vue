<script setup lang="ts" vapor>
import type { PopoverTriggerProps } from "./popover.types";

import { computed, shallowRef, watch } from "vue";

import { composePressResponder, usePressResponder } from "../../composables/press-responder";
import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { FOCUSABLE_SELECTOR } from "../../utils/focus";

import { usePopoverContext } from "./popover.context";

const props = defineProps<PopoverTriggerProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = usePopoverContext();

// Supplied by the popover root, which is what makes this a trigger rather than a plain box.
const responder = usePressResponder();

const styles = computed(() => slots.value.trigger({ class: props.class }));

// Yielded whenever the slot already brought something focusable: wrapping a real control in
// `role="button"` nests one interactive element inside another. The responder's attributes go with
// the role - a pressable inside consumes the same responder and already carries them, so the copy
// here was a second `aria-expanded` and a duplicate `id` on the same page.
//
// Read after the flush rather than in the ref callback, which vapor runs before the slot's own
// content has been inserted - there the answer is always "nothing focusable".
const host = shallowRef<HTMLElement | null>(null);
const hasFocusableContent = shallowRef(false);

const setElement = (element: unknown) => {
  host.value = (element as HTMLElement | null) ?? null;
  responder?.registerElement(host.value);
};

watch(
  host,
  (element) => {
    hasFocusableContent.value = Boolean(element?.querySelector(FOCUSABLE_SELECTOR));
  },
  { flush: "post" },
);

// The stylesheet keys the focus ring on the attribute, and a `div` has no pseudo-class branch it
// could fall back to.
const { isFocusVisible, onBlur, onFocus } = useInteractionStates();

// A `div` is not focusable on its own, and this one has to be: the popover is opened from it by
// keyboard as well as by pointer.
//
// Listeners are attached here rather than spread with `v-bind`, which in vapor re-attaches them
// on every render — see `composePressResponder`.
const press = composePressResponder(responder);
const wrapperAttrs = computed(() =>
  hasFocusableContent.value ? undefined : responder?.attrs.value,
);
</script>

<template>
  <div
    :ref="setElement"
    :class="styles"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-pressed="dataAttr(responder?.isPressed.value)"
    data-slot="popover-trigger"
    :role="hasFocusableContent ? undefined : 'button'"
    :tabindex="hasFocusableContent ? undefined : 0"
    v-bind="wrapperAttrs"
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
