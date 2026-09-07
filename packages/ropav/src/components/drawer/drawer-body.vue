<script setup lang="ts" vapor>
import type { DrawerBodyProps } from "./drawer.types";

const props = defineProps<DrawerBodyProps>();

defineSlots<{ default?: () => unknown }>();

/**
 * Vertical scrolling is opted back in here.
 *
 * The panel around this claims the whole gesture so the drawer can be dragged away, which would
 * otherwise make a long body impossible to scroll on a touch screen. The drag gesture also bails
 * out on anything inside this element, keyed on its own slot — so the attribute below is part of the
 * behaviour, not only of the styling.
 */
</script>

<template>
  <div
    :class="['rp-drawer__body', props.class]"
    data-slot="drawer-body"
    style="touch-action: pan-y"
  >
    <slot />
  </div>
</template>
