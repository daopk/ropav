<script setup lang="ts" vapor>
import type { SidebarItemIconProps } from "./sidebar.types";

const props = defineProps<SidebarItemIconProps>();

defineSlots<{ default?: () => unknown }>();

/*
 * `aria-hidden` because the icon repeats what the label already says, and a collapsed sidebar
 *    keeps that label as `sr-only` rather than dropping it.
 */
</script>

<template>
  <span
    aria-hidden="true"
    :class="['rp-sidebar__item-icon', props.class]"
    data-slot="sidebar-item-icon"
  >
    <slot />
  </span>
</template>
