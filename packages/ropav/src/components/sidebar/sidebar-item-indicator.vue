<script setup lang="ts" vapor>
import type { SidebarItemIndicatorProps } from "./sidebar.types";

import { computed } from "vue";

import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import IconChevronDown from "../icons/icon-chevron-down.vue";

import { useSidebarCollapsibleContext, useSidebarContext } from "./sidebar.context";

const props = defineProps<SidebarItemIndicatorProps>();

const iconSlots = defineSlots<{ default?: () => unknown }>();

const { slots, state } = useSidebarContext();
const collapsible = useSidebarCollapsibleContext();

/**
 * With no icon of its own to render, the built-in chevron carries the class and the state directly,
 * exactly as `disclosure-indicator.vue` does. That matters inside a button, where the stylesheet
 * reaches icons through an `svg` selector: a wrapper element would not match it.
 *
 * A custom icon does need a wrapper. Reading a slot in Vapor renders it, so the icon cannot be
 * inspected and handed the class the way React clones it into place.
 */
const hasCustomIcon = iconSlots.default !== undefined;

const className = computed(() => composeSlotClassName(slots.value.itemIndicator, props.class));
</script>

<template>
  <!-- `data-collapsed` is what takes it off the rail, where there is no submenu for it to point at
    and a chevron promising one would be a promise nothing keeps. -->
  <span
    v-if="hasCustomIcon"
    aria-hidden="true"
    :class="className"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    :data-expanded="dataAttr(collapsible.isExpanded.value)"
    data-slot="sidebar-item-indicator"
  >
    <slot />
  </span>
  <IconChevronDown
    v-else
    :class="className"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    :data-expanded="dataAttr(collapsible.isExpanded.value)"
    data-slot="sidebar-item-indicator"
  />
</template>
