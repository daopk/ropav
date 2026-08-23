<script setup lang="ts" vapor>
import type { PaginationNextIconProps } from "./pagination.types";

import { IconChevronRight } from "../icons";

const props = defineProps<PaginationNextIconProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span aria-hidden="true" :class="props.class" data-slot="pagination-next-icon">
    <slot><IconChevronRight /></slot>
  </span>
</template>
