<script setup lang="ts" vapor>
import type { FocusResponderHandlers } from "@/composables/focus-responder";
import type { UsePressHandlers } from "@/composables/use-press";

import { computed } from "vue";

import { ButtonRoot } from "@/components/button";
import { provideFocusResponder } from "@/composables/focus-responder";
import { providePressResponder } from "@/composables/press-responder";

/**
 * A button with a press supplied from above, a hover-and-focus supplied from above, or both.
 *
 * Both at once is the case worth having: a button inside a dropdown already takes its press from
 * the menu trigger, and a tooltip wrapped around that button has to be able to watch it without
 * taking the press away.
 */
const props = defineProps<{
  withPress?: boolean;
  withFocus?: boolean;
  record: (name: string) => void;
}>();

const noop = () => {};

if (props.withPress) {
  providePressResponder({
    attrs: computed(() => ({ "aria-expanded": false, id: "press-id" })),
    handlers: computed<UsePressHandlers>(() => ({
      onClick: () => props.record("press:click"),
      onDragstart: noop,
      onKeydown: () => props.record("press:keydown"),
      onMousedown: noop,
      onPointerdown: () => props.record("press:pointerdown"),
      onPointerenter: () => props.record("press:pointerenter"),
      onPointerleave: () => props.record("press:pointerleave"),
      onPointerup: noop,
    })),
    isPressed: computed(() => false),
    registerElement: noop,
  });
}

if (props.withFocus) {
  provideFocusResponder({
    attrs: computed(() => ({ "aria-describedby": "focus-description" })),
    handlers: computed<FocusResponderHandlers>(() => ({
      onBlur: () => props.record("focus:blur"),
      onFocus: () => props.record("focus:focus"),
      onKeydown: () => props.record("focus:keydown"),
      onPointerdown: () => props.record("focus:pointerdown"),
      onPointerenter: () => props.record("focus:pointerenter"),
      onPointerleave: () => props.record("focus:pointerleave"),
    })),
    registerElement: noop,
  });
}
</script>

<template>
  <ButtonRoot>Press me</ButtonRoot>
</template>
