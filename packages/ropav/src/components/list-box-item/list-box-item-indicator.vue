<script setup lang="ts" vapor>
import type {
  ListBoxItemIndicatorProps,
  ListBoxItemIndicatorSlotProps,
} from "./list-box-item.types";

import { computed } from "vue";

import { dataAttr } from "../../utils/assertion";

import { useListBoxItemContext } from "./list-box-item.context";

const props = defineProps<ListBoxItemIndicatorProps>();

defineSlots<{ default?: (props: ListBoxItemIndicatorSlotProps) => unknown }>();

const { isSelected, slots } = useListBoxItemContext();

// The checkmark is drawn rather than toggled: the dash offset animates the stroke into place, so
// the element stays mounted and only this number changes.
const strokeDashoffset = computed(() => (isSelected.value ? 44 : 66));
</script>

<template>
  <span
    aria-hidden="true"
    :class="slots.indicator({ class: props.class })"
    :data-slot="'list-box-item-indicator'"
    :data-visible="dataAttr(isSelected)"
  >
    <slot :is-selected="isSelected">
      <svg
        aria-hidden="true"
        data-slot="list-box-item-indicator--checkmark"
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
