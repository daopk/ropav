<script setup lang="ts" vapor>
import type {TableLoadMoreContentProps} from "./table.types";

import {composeSlotClassName} from "../../utils/compose";

import {useTableContext} from "./table.context";

const props = defineProps<TableLoadMoreContentProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useTableContext();
</script>

<template>
  <div
    :class="composeSlotClassName(slots.loadMoreContent, props.class)"
    data-slot="table-load-more-content"
  >
    <slot />
  </div>
</template>
