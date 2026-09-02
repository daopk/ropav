<script setup lang="ts" vapor>
import type { VirtualizerItemProps } from "./virtualizer.types";

import { shallowRef } from "vue";

import { useVirtualizerItem } from "./use-virtualizer-item";

const props = defineProps<VirtualizerItemProps>();

defineSlots<{ default?: () => unknown }>();

const element = shallowRef<HTMLElement | null>(null);

const { style } = useVirtualizerItem({
  element,
  layoutInfo: () => props.layoutInfo,
  parentLayoutInfo: () => props.parentLayoutInfo,
});
</script>

<template>
  <div ref="element" role="presentation" :style="style">
    <slot />
  </div>
</template>
