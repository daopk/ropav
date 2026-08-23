<script setup lang="ts" vapor>
import type { PaginationItemProps } from "./pagination.types";

import { composeSlotClassName } from "../../utils/compose";

import { usePaginationContext } from "./pagination.context";

const props = defineProps<PaginationItemProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = usePaginationContext();
</script>

<template>
  <li :class="composeSlotClassName(slots.item, props.class)" data-slot="pagination-item">
    <slot />
  </li>
</template>
