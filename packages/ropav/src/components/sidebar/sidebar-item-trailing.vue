<script setup lang="ts" vapor>
import type { SidebarItemTrailingProps, SidebarPartSlotProps } from "./sidebar.types";

import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useSidebarContext } from "./sidebar.context";

const props = defineProps<SidebarItemTrailingProps>();

defineSlots<{ default?: (props: SidebarPartSlotProps) => unknown }>();

const { slots, state } = useSidebarContext();
</script>

<template>
  <!-- Hidden outright when the sidebar narrows, unlike the label: a count or a chevron beside the
    icon has nowhere to go on the rail, and repeats nothing the name does not already carry. -->
  <span
    :class="composeSlotClassName(slots.itemTrailing, props.class)"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    data-slot="sidebar-item-trailing"
  >
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-mobile="state.isMobile.value"
      :is-open="state.isOpen.value"
    />
  </span>
</template>
