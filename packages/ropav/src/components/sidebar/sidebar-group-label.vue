<script setup lang="ts" vapor>
import type { SidebarGroupLabelProps, SidebarPartSlotProps } from "./sidebar.types";

import { onScopeDispose } from "vue";

import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useSidebarContext, useSidebarGroupContext } from "./sidebar.context";

const props = defineProps<SidebarGroupLabelProps>();

defineSlots<{ default?: (props: SidebarPartSlotProps) => unknown }>();

const { slots, state } = useSidebarContext();
const group = useSidebarGroupContext();

// Registered in setup rather than on mount, so the group learns it has a label within the same
// flush that renders it: waiting for `mounted` would leave `aria-labelledby` off the group for a
// tick, and a screen reader reading the tree in that window finds a group with no name.
const unregister = group?.registerLabel();

onScopeDispose(() => unregister?.(), true);
</script>

<template>
  <!-- `sr-only` rather than gone when the sidebar narrows: this is what tells a screen reader which
    group an item belongs to, and a collapsed sidebar is still being read. -->
  <div
    :id="group?.labelId.value"
    :class="composeSlotClassName(slots.groupLabel, props.class)"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    data-slot="sidebar-group-label"
  >
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-mobile="state.isMobile.value"
      :is-open="state.isOpen.value"
    />
  </div>
</template>
