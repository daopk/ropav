<script setup lang="ts" vapor>
import type {TableContentProps} from "./table.types";

import {useId} from "../../composables/use-id";
import {useTableCollection} from "../../composables/use-table-collection";
import {composeSlotClassName} from "../../utils/compose";

import {provideTableGridContext, useTableContext} from "./table.context";

const props = defineProps<TableContentProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useTableContext();

const tableId = useId();
const collectionId = useId();

const collection = useTableCollection();

provideTableGridContext({collection, collectionId, tableId});
</script>

<template>
  <table
    :id="tableId"
    :class="composeSlotClassName(slots.content, props.class)"
    :data-collection="collectionId"
    data-slot="table-content"
    role="grid"
    :tabindex="0"
  >
    <slot />
  </table>
</template>
