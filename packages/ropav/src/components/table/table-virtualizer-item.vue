<script setup lang="ts" vapor>
import type { VirtualizerItemProps } from "../virtualizer/virtualizer.types";

import { shallowRef } from "vue";

import { useVirtualizerItem } from "../virtualizer/use-virtualizer-item";

import { useTableVirtualizerContext } from "./table.context";

/**
 * The wrapper around a part of a virtualized table, or nothing at all.
 *
 * A part of a virtualized table sits inside a wrapper carrying the geometry the layout worked out
 * for it, and a part of a plain table sits inside nothing. That is one element's difference in
 * markup, but a `v-if` on the wrapper would mean writing the part itself out twice — thirty
 * attributes and a slot, in two branches that have to stay identical.
 *
 * Which of the two it is comes from the context rather than from the geometry, and has to: a
 * column's geometry only exists once the column has registered itself from the DOM, so a wrapper
 * conditional on the geometry would destroy the element whose registration created it, unregister
 * it, and flap between the two branches for ever.
 *
 * The wrapper is rendered here rather than delegated to `VirtualizerItem`: a drop indicator mounts
 * one of these for every row of the window, and a scroll that replaces the window pays for every
 * component instance in it. Rows and cells go further and carry their geometry themselves.
 */
const props = defineProps<VirtualizerItemProps>();

defineSlots<{ default?: () => unknown }>();

const isVirtualized = useTableVirtualizerContext() != null;

const element = shallowRef<HTMLElement | null>(null);

const style = isVirtualized
  ? useVirtualizerItem({
      element,
      layoutInfo: () => props.layoutInfo,
      parentLayoutInfo: () => props.parentLayoutInfo,
    }).style
  : null;
</script>

<template>
  <div v-if="isVirtualized" ref="element" role="presentation" :style="style">
    <slot />
  </div>
  <slot v-else />
</template>
