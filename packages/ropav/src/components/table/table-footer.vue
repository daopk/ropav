<script setup lang="ts" vapor>
import type { TableFooterProps } from "./table.types";

const props = defineProps<TableFooterProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-table__footer', props.class]" data-slot="table-footer">
    <slot />
  </div>
</template>
