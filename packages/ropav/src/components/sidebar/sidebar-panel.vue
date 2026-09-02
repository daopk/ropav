<script setup lang="ts" vapor>
import type { SidebarPanelProps, SidebarPartSlotProps } from "./sidebar.types";

import { computed } from "vue";

import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useSidebarContext } from "./sidebar.context";

const props = defineProps<SidebarPanelProps>();

defineSlots<{ default?: (props: SidebarPartSlotProps) => unknown }>();

const { panelId, side, slots, state } = useSidebarContext();

/*
 * Only the mode that hides the panel outright takes it out of the tab order. Collapsed to the icon
 * rail every item is still on screen and still a target, so `inert` there would strand a nav a
 * keyboard user can see — the same distinction `splitter-panel.vue` draws for a panel dragged shut.
 */
const isHidden = computed(() => state.collapsible.value === "offcanvas" && state.isCollapsed.value);
</script>

<template>
  <nav
    :id="panelId"
    :aria-label="props.ariaLabelledby ? undefined : (props.ariaLabel ?? 'Sidebar')"
    :aria-labelledby="props.ariaLabelledby"
    :class="composeSlotClassName(slots.panel, props.class)"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    :data-side="side"
    data-slot="sidebar-panel"
    :inert="isHidden || undefined"
  >
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-mobile="state.isMobile.value"
      :is-open="state.isOpen.value"
    />
  </nav>
</template>
