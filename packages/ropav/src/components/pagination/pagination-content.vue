<script setup lang="ts" vapor>
import type { PaginationContentProps } from "./pagination.types";

import { composeSlotClassName } from "../../utils/compose";

import { usePaginationContext } from "./pagination.context";

const props = defineProps<PaginationContentProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = usePaginationContext();
</script>

<template>
  <ul :class="composeSlotClassName(slots.content, props.class)" data-slot="pagination-content">
    <slot />
  </ul>
</template>
