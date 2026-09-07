<script setup lang="ts" vapor>
import type { TableLoadMoreContentProps } from "./table.types";

const props = defineProps<TableLoadMoreContentProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-table__load-more-content', props.class]" data-slot="table-load-more-content">
    <slot />
  </div>
</template>
