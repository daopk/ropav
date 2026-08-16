<script setup lang="ts" vapor>
import type {SkeletonRootProps} from "./skeleton.types";
import type {SkeletonVariants} from "@heroui/styles";

import {skeletonVariants} from "@heroui/styles";
import {computed} from "vue";

import {useCssVariable} from "../../composables/use-css-variable";

const props = defineProps<SkeletonRootProps>();

defineSlots<{default?: () => unknown}>();

// Keep the animation themeable without baking the default into the component. A prop remains an
// explicit override, matching `useCSSVariable` in the React implementation.
const resolvedAnimationType = useCssVariable("--skeleton-animation", {
  override: () => props.animationType,
});

const styles = computed(() =>
  skeletonVariants({
    animationType: resolvedAnimationType.value as SkeletonVariants["animationType"],
  }).base({class: props.class}),
);
</script>

<template>
  <div :class="styles" data-slot="skeleton">
    <slot />
  </div>
</template>
