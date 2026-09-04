<script setup lang="ts" vapor>
import { computed } from "vue";

import { providePressResponder } from "../../composables/press-responder";

import { useDrawerContext } from "./drawer.context";

defineSlots<{ default?: () => unknown }>();

const { state } = useDrawerContext();

/**
 * Turns whatever pressable sits inside into a control that closes the drawer.
 *
 * React marks such a button with a named slot, which is a mechanism Vue has no equivalent of, so the
 * behaviour is handed down instead — the same way a dropdown hands its trigger down. Renders no
 * element of its own, so the markup and the styling are unchanged by wrapping.
 *
 * Deliberately opt-in: an unmarked `<Button>` in the footer does **not** close the drawer.
 *
 * The close runs *before* the button's own handler, which is the order `composePressResponder`
 * chains them in — so `<DrawerClose><Button @click="save"/></DrawerClose>` saves and closes.
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
