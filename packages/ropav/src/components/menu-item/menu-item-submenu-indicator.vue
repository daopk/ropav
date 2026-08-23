<script setup lang="ts" vapor>
import type {MenuItemSubmenuIndicatorProps} from "./menu-item.types";

import {IconChevronRight} from "../icons";

import {useMenuItemContext} from "./menu-item.context";

const props = defineProps<MenuItemSubmenuIndicatorProps>();

defineSlots<{default?: () => unknown}>();

const {hasSubmenu, slots} = useMenuItemContext();
</script>

<template>
  <span
    v-if="hasSubmenu"
    aria-hidden="true"
    :class="slots.submenuIndicator({class: props.class})"
    data-slot="submenu-indicator"
  >
    <slot>
      <IconChevronRight />
    </slot>
  </span>
</template>
