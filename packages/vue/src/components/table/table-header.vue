<script setup lang="ts" vapor>
import type {TableHeaderProps} from "./table.types";

import {composeSlotClassName} from "../../utils/compose";

import {useTableContext} from "./table.context";

const props = defineProps<TableHeaderProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useTableContext();
</script>

<template>
  <thead
    :class="composeSlotClassName(slots.header, props.class)"
    data-slot="table-header"
    role="rowgroup"
  >
    <tr role="row">
      <slot />
    </tr>
  </thead>
</template>
