<script setup lang="ts" vapor>
import type {ToastRenderableProps} from "./toast.types";

import {computed} from "vue";

const props = defineProps<ToastRenderableProps>();

/**
 * A title handed in through the queue is a string far more often than it is a component, and the
 * two need different insertion: text goes in as text, a component through `<component :is>`.
 *
 * React needs none of this because a `ReactNode` covers both. Vapor has no such value,
 * which is why the imperative API takes a component instead.
 */
const isText = computed(() => typeof props.value === "string" || typeof props.value === "number");
</script>

<template>
  <template v-if="props.value == null" />
  <template v-else-if="isText">{{ props.value }}</template>
  <component :is="props.value" v-else />
</template>
