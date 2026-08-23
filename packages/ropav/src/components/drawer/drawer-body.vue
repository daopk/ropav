<script setup lang="ts" vapor>
import type { DrawerBodyProps } from "./drawer.types";

import { computed } from "vue";

import { useDrawerContext } from "./drawer.context";

const props = defineProps<DrawerBodyProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useDrawerContext();

const styles = computed(() => slots.value.body({ class: props.class }));

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
  <div :class="styles" data-slot="drawer-body" style="touch-action: pan-y">
    <slot />
  </div>
</template>
