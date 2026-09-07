<script setup lang="ts" vapor>
import type { PaginationEllipsisProps } from "./pagination.types";

const props = defineProps<PaginationEllipsisProps>();
</script>

<template>
  <span
    aria-hidden="true"
    :class="['rp-pagination__ellipsis', props.class]"
    data-slot="pagination-ellipsis"
    >&hellip;</span
  >
</template>
