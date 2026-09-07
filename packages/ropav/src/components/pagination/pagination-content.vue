<script setup lang="ts" vapor>
import type { PaginationContentProps } from "./pagination.types";

const props = defineProps<PaginationContentProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <ul :class="['rp-pagination__content', props.class]" data-slot="pagination-content">
    <slot />
  </ul>
</template>
