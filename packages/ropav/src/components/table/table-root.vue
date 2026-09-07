<script setup lang="ts" vapor>
import type { TableRootProps } from "./table.types";

import { tableVariants } from "@ropav/styles";
import { computed } from "vue";

const props = defineProps<TableRootProps>();

defineSlots<{ default?: () => unknown }>();

const slots = computed(() => tableVariants({ variant: props.variant }));
</script>

<template>
  <div :class="slots.base({ class: props.class })" data-slot="table">
    <slot />
  </div>
</template>
