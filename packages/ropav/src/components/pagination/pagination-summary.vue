<script setup lang="ts" vapor>
import type { PaginationSummaryProps } from "./pagination.types";

import { composeSlotClassName } from "../../utils/compose";

import { usePaginationContext } from "./pagination.context";

const props = defineProps<PaginationSummaryProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = usePaginationContext();
</script>

<template>
  <div
    :class="composeSlotClassName(slots.summary, props.class)"
    data-slot="pagination-summary"
    dir="auto"
  >
    <slot />
  </div>
</template>
