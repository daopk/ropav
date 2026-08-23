<script setup lang="ts" vapor>
import { computed } from "vue";

import { providePressResponder } from "../../composables/press-responder";

import { useModalContext } from "./modal.context";

defineSlots<{ default?: () => unknown }>();

const { state } = useModalContext();

/**
 * Turns whatever pressable sits inside into a control that closes the modal.
 *
 * React marks such a button `slot="close"`, which is a mechanism Vue has no equivalent of, so the
 * behaviour is handed down instead — the same way a dropdown hands its trigger down. Renders no
 * element of its own, so the markup and the styling are unchanged by wrapping.
 *
 * Deliberately opt-in: an unmarked `<Button>` inside a dialog does **not** close it, matching
 * React, where the default slot carries nothing.
 *
 * The close runs *before* the button's own handler, which is the order `composePressResponder`
 * chains them in — so `<Modal.Close><Button @click="save"/></Modal.Close>` saves and closes, the
 * same as `slot="close"` with an `onPress`.
 */
providePressResponder({
  attrs: computed(() => ({})),
  handlers: computed(() => ({
    onClick: () => state.close(),
    onDragstart: () => {},
    onKeydown: () => {},
    onMousedown: () => {},
    onPointerdown: () => {},
    onPointerenter: () => {},
    onPointerleave: () => {},
    onPointerup: () => {},
  })),
  isPressed: computed(() => false),
  registerElement: () => {},
});
</script>

<template>
  <slot />
</template>
