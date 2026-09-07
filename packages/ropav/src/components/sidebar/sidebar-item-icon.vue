<script setup lang="ts" vapor>
import type { SidebarItemIconProps } from "./sidebar.types";

import { composeSlotClassName } from "../../utils/compose";

import { useSidebarContext } from "./sidebar.context";

const props = defineProps<SidebarItemIconProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useSidebarContext();

/*
 * `aria-hidden` because the icon repeats what the label already says, and a collapsed sidebar
 *    keeps that label as `sr-only` rather than dropping it.
 */
</script>

<template>
  <span
    aria-hidden="true"
    :class="composeSlotClassName(slots.itemIcon, props.class)"
    data-slot="sidebar-item-icon"
  >
    <slot />
  </span>
</template>
