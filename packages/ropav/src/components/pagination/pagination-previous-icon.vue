<script setup lang="ts" vapor>
import type {PaginationPreviousIconProps} from "./pagination.types";

import {IconChevronLeft} from "../icons";

const props = defineProps<PaginationPreviousIconProps>();

defineSlots<{default?: () => unknown}>();
</script>

<template>
  <span aria-hidden="true" :class="props.class" data-slot="pagination-previous-icon">
    <slot><IconChevronLeft /></slot>
  </span>
</template>
