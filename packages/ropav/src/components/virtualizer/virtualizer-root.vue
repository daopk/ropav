<script setup lang="ts" vapor>
import type {Layout} from "../../utils/virtualizer-layout";
import type {VirtualizerLayoutProp, VirtualizerRootProps} from "./virtualizer.types";

import {computed, shallowRef, watch} from "vue";

import {provideVirtualizerConfigContext} from "./virtualizer.context";

const props = defineProps<VirtualizerRootProps>();

defineSlots<{default?: () => unknown}>();

/** A class is instantiated once; an instance is taken as it is, as React Aria has it. */
const resolveLayout = (layout: VirtualizerLayoutProp): Layout<object> =>
  typeof layout === "function" ? new layout() : layout;

// `shallowRef`, never `ref`: a layout keeps caches in plain `Map`s and `Rect`s, and a deep ref
// would proxy every one of them.
const layout = shallowRef(resolveLayout(props.layout));

watch(
  () => props.layout,
  (next) => {
    layout.value = resolveLayout(next);
  },
);

provideVirtualizerConfigContext({
  layout,
  layoutOptions: computed(() => props.layoutOptions),
  shouldObserveItemSize: computed(() => props.shouldObserveItemSize ?? false),
});
</script>

<template>
  <slot />
</template>
