<script setup lang="ts" vapor>
import type {TableScrollContainerProps} from "./table.types";

import {composeSlotClassName} from "../../utils/compose";

import {useTableContext} from "./table.context";

const props = defineProps<TableScrollContainerProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useTableContext();
</script>

<template>
  <div
    :class="composeSlotClassName(slots.scrollContainer, props.class)"
    data-slot="table-scroll-container"
  >
    <slot />
  </div>
</template>
