<script setup lang="ts" vapor>
import type { PaginationItemProps } from "./pagination.types";

const props = defineProps<PaginationItemProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <li :class="['rp-pagination__item', props.class]" data-slot="pagination-item">
    <slot />
  </li>
</template>
