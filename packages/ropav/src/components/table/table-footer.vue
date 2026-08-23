<script setup lang="ts" vapor>
import type { TableFooterProps } from "./table.types";

import { composeSlotClassName } from "../../utils/compose";

import { useTableContext } from "./table.context";

const props = defineProps<TableFooterProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useTableContext();
</script>

<template>
  <div :class="composeSlotClassName(slots.footer, props.class)" data-slot="table-footer">
    <slot />
  </div>
</template>
