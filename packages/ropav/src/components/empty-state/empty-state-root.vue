<script setup lang="ts" vapor>
import type {EmptyStateRootProps} from "./empty-state.types";

import {emptyStateVariants} from "@ropav/styles";
import {computed} from "vue";

const props = defineProps<EmptyStateRootProps>();

defineSlots<{default?: () => unknown}>();

const styles = computed(() => emptyStateVariants({class: props.class}));
</script>

<template>
  <!--
    The default message is slot fallback content rather than a `children ?? "…"` check: the
    slot would have to be executed to be inspected, and executing it is what creates the DOM.
  -->
  <div :class="styles" data-slot="empty-state">
    <slot>No results found</slot>
  </div>
</template>
