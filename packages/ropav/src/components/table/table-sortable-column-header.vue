<script setup lang="ts" vapor>
import type { TableSortableColumnHeaderProps } from "./table.types";

import { computed } from "vue";

import { composeSlotClassName } from "../../utils/compose";
import { IconChevronUp } from "../icons";

import { useTableContext } from "./table.context";

const props = withDefaults(defineProps<TableSortableColumnHeaderProps>(), { showIndicator: true });

defineSlots<{ default?: () => unknown; indicator?: () => unknown }>();

const { slots } = useTableContext();

const showsIndicator = computed(() => props.showIndicator && Boolean(props.sortDirection));
</script>

<template>
  <span
    :class="composeSlotClassName(slots.sortableColumnHeader, props.class)"
    :data-direction="props.sortDirection"
    data-slot="table-sortable-column-header"
  >
    <slot />
    <slot v-if="showsIndicator" name="indicator">
      <IconChevronUp
        :class="slots.sortableColumnIndicator()"
        :data-direction="props.sortDirection"
        data-slot="table-sortable-column-indicator"
      />
    </slot>
  </span>
</template>
