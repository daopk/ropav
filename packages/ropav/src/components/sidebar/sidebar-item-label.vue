<script setup lang="ts" vapor>
import type { SidebarItemLabelProps, SidebarPartSlotProps } from "./sidebar.types";

import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useSidebarContext } from "./sidebar.context";

const props = defineProps<SidebarItemLabelProps>();

defineSlots<{ default?: (props: SidebarPartSlotProps) => unknown }>();

const { slots, state } = useSidebarContext();
</script>

<template>
  <!-- Collapsed, this goes `sr-only` rather than away: it is the item's accessible name, and an
    icon-only nav that has dropped every name is a list of unlabelled buttons. -->
  <span
    :class="composeSlotClassName(slots.itemLabel, props.class)"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    data-slot="sidebar-item-label"
  >
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-mobile="state.isMobile.value"
      :is-open="state.isOpen.value"
    />
  </span>
</template>
