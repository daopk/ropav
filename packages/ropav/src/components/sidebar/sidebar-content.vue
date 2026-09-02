<script setup lang="ts" vapor>
import type { SidebarContentProps, SidebarPartSlotProps } from "./sidebar.types";

import { composeSlotClassName } from "../../utils/compose";
import { provideSeparatorContext } from "../separator/separator.context";

import { useSidebarContext } from "./sidebar.context";

const props = defineProps<SidebarContentProps>();

defineSlots<{ default?: (props: SidebarPartSlotProps) => unknown }>();

const { slots, state } = useSidebarContext();

// The content is a flex column that lays its own children out, so a rule between two of them has
// to take part in that layout rather than being the block-level `hr` it would be on its own —
// the same hand-down `menu-root.vue` makes. Provided here rather than on the panel, because a rule
// drawn between the header and the content is a block-level one and an `hr` is right for it.
provideSeparatorContext({ elementType: "div" });
</script>

<template>
  <div :class="composeSlotClassName(slots.content, props.class)" data-slot="sidebar-content">
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-mobile="state.isMobile.value"
      :is-open="state.isOpen.value"
    />
  </div>
</template>
