<script setup lang="ts" vapor>
import type { TableSortableColumnHeaderProps } from "./table.types";

import { computed } from "vue";

import { IconChevronUp } from "../icons";

const props = withDefaults(defineProps<TableSortableColumnHeaderProps>(), { showIndicator: true });

defineSlots<{ default?: () => unknown; indicator?: () => unknown }>();

const showsIndicator = computed(() => props.showIndicator && Boolean(props.sortDirection));
</script>

<template>
  <span
    :class="['rp-table__sortable-column-header', props.class]"
    :data-direction="props.sortDirection"
    data-slot="table-sortable-column-header"
  >
    <slot />
    <slot v-if="showsIndicator" name="indicator">
      <IconChevronUp
        class="rp-table__sortable-column-indicator"
        :data-direction="props.sortDirection"
        data-slot="table-sortable-column-indicator"
      />
    </slot>
  </span>
</template>
