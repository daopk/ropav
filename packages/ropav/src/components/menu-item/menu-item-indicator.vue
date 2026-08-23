<script setup lang="ts" vapor>
import type { MenuItemIndicatorProps, MenuItemIndicatorSlotProps } from "./menu-item.types";

import { computed } from "vue";

import { dataAttr } from "../../utils/assertion";

import { useMenuItemContext } from "./menu-item.context";

const props = withDefaults(defineProps<MenuItemIndicatorProps>(), { type: "checkmark" });

defineSlots<{ default?: (props: MenuItemIndicatorSlotProps) => unknown }>();

const { isSelected, slots } = useMenuItemContext();

/**
 * The checkmark is drawn rather than revealed: the stroke is dashed to exactly its own length and
 * the offset slid from past the end to the start, so it appears to be written on. Hiding and
 * showing it would lose that, which is why the offsets are numbers here and not a class.
 */
const strokeDashoffset = computed(() => (isSelected.value ? 44 : 66));
</script>

<template>
  <span
    aria-hidden="true"
    :class="slots.indicator({ class: props.class })"
    data-slot="menu-item-indicator"
    :data-type="props.type"
    :data-visible="dataAttr(isSelected)"
  >
    <slot :is-selected="isSelected">
      <svg
        v-if="props.type === 'dot'"
        aria-hidden="true"
        data-slot="menu-item-indicator--dot"
        fill="currentColor"
        fill-rule="evenodd"
        role="presentation"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path clip-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14" fill-rule="evenodd" />
      </svg>
      <svg
        v-else
        aria-hidden="true"
        data-slot="menu-item-indicator--checkmark"
        fill="none"
        role="presentation"
        stroke="currentColor"
        stroke-dasharray="22"
        :stroke-dashoffset="strokeDashoffset"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 17 18"
      >
        <polyline points="1 9 7 14 15 4" />
      </svg>
    </slot>
  </span>
</template>
