<script setup lang="ts" vapor>
import type {LayoutInfo} from "../../utils/virtualizer-layout-info";

import {VirtualizerItem} from "../virtualizer";

import {useTableVirtualizerContext} from "./table.context";

/**
 * A `VirtualizerItem` wrapper for a table part, or nothing at all.
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
 */
const props = defineProps<{
  /** Where this part goes, or `null` while the layout cannot say yet. */
  layoutInfo?: LayoutInfo | null;
  /** The enclosing part's layout info, which the offset is relative to. */
  parentLayoutInfo?: LayoutInfo | null;
}>();

defineSlots<{default?: () => unknown}>();

const isVirtualized = useTableVirtualizerContext() != null;
</script>

<template>
  <VirtualizerItem
    v-if="isVirtualized"
    :layout-info="props.layoutInfo"
    :parent-layout-info="props.parentLayoutInfo"
  >
    <slot />
  </VirtualizerItem>
  <slot v-else />
</template>
