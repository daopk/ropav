<script setup lang="ts" vapor>
import { computed } from "vue";

import { providePressResponder } from "../../composables/press-responder";

import { useAlertDialogContext } from "./alert-dialog.context";

defineSlots<{ default?: () => unknown }>();

const { state } = useAlertDialogContext();

/**
 * Turns whatever pressable sits inside into a control that closes the dialog.
 *
 * React marks such a button with a named slot, which is a mechanism Vue has no equivalent of, so the
 * behaviour is handed down instead — the same way a dropdown hands its trigger down. Renders no
 * element of its own, so the markup and the styling are unchanged by wrapping.
 *
 * Deliberately opt-in: an unmarked `<Button>` in the footer does **not** close the dialog. For an
 * alert dialog that matters more than for a modal — Cancel and Confirm sit side by side, and only
 * one of them should also be an answer.
 *
 * The close runs *before* the button's own handler, which is the order `composePressResponder`
 * chains them in — so `<AlertDialogClose><Button @click="remove"/></AlertDialogClose>` removes and
 * closes.
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
