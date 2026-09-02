<script setup lang="ts" vapor>
import type { SidebarFooterProps, SidebarPartSlotProps } from "./sidebar.types";

import { composeSlotClassName } from "../../utils/compose";

import { useSidebarContext } from "./sidebar.context";

const props = defineProps<SidebarFooterProps>();

defineSlots<{ default?: (props: SidebarPartSlotProps) => unknown }>();

const { slots, state } = useSidebarContext();
</script>

<template>
  <div :class="composeSlotClassName(slots.footer, props.class)" data-slot="sidebar-footer">
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-mobile="state.isMobile.value"
      :is-open="state.isOpen.value"
    />
  </div>
</template>
