<script setup lang="ts" vapor>
import type { DrawerHandleProps } from "./drawer.types";

import { computed } from "vue";

import { useDrawerContext } from "./drawer.context";

const props = defineProps<DrawerHandleProps>();

const { slots } = useDrawerContext();

const styles = computed(() => slots.value.handle({ class: props.class }));

/**
 * No content slot, deliberately.
 *
 * The bar is the whole element, and the stylesheet sizes it through a direct-child selector keyed on
 * its own slot — so anything a caller put here would either be styled as the bar or sit beside it.
 * React declares a `children` prop and then drops it on the floor; not declaring one says the same
 * thing out loud.
 *
 * Hidden from assistive technology: it is a grab affordance for a pointer, and there is nothing to
 * announce.
 */
</script>

<template>
  <div aria-hidden="true" :class="styles" data-slot="drawer-handle">
    <div data-slot="drawer-handle-bar" />
  </div>
</template>
