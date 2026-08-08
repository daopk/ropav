<script setup lang="ts" vapor>
import type {PaginationEllipsisProps} from "./pagination.types";

import {composeSlotClassName} from "../../utils/compose";

import {usePaginationContext} from "./pagination.context";

const props = defineProps<PaginationEllipsisProps>();

const {slots} = usePaginationContext();
</script>

<template>
  <span
    aria-hidden="true"
    :class="composeSlotClassName(slots.ellipsis, props.class)"
    data-slot="pagination-ellipsis"
    >&hellip;</span
  >
</template>
