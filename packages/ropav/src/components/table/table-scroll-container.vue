<script setup lang="ts" vapor>
import type { TableScrollContainerProps } from "./table.types";

const props = defineProps<TableScrollContainerProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-table__scroll-container', props.class]" data-slot="table-scroll-container">
    <slot />
  </div>
</template>
