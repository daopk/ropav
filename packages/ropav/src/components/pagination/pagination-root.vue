<script setup lang="ts" vapor>
import type { PaginationRootProps } from "./pagination.types";

import { paginationVariants } from "@ropav/styles";
import { computed } from "vue";

import { providePaginationContext } from "./pagination.context";

const props = defineProps<PaginationRootProps>();

defineSlots<{ default?: () => unknown }>();

const slots = computed(() => paginationVariants({ size: props.size }));

providePaginationContext({ slots });
</script>

<template>
  <nav
    aria-label="pagination"
    :class="slots.base({ class: props.class })"
    data-slot="pagination"
    role="navigation"
  >
    <slot />
  </nav>
</template>
