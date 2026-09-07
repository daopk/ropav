<script setup lang="ts" vapor>
import type { PaginationSummaryProps } from "./pagination.types";

const props = defineProps<PaginationSummaryProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-pagination__summary', props.class]" data-slot="pagination-summary" dir="auto">
    <slot />
  </div>
</template>
