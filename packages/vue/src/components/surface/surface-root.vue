<script setup lang="ts" vapor>
import type {SurfaceRootProps} from "./surface.types";

import {surfaceVariants} from "@heroui/styles";
import {computed} from "vue";

import {provideSurfaceContext} from "./surface.context";

const props = withDefaults(defineProps<SurfaceRootProps>(), {variant: "default"});

defineSlots<{default?: () => unknown}>();

const styles = computed(() => surfaceVariants({class: props.class, variant: props.variant}));

// Descendants read the surface behind them to choose an "on-surface" colour, so the variant
// has to travel down rather than staying a styling detail of this element.
provideSurfaceContext({variant: computed(() => props.variant)});
</script>

<template>
  <div :class="styles" data-slot="surface">
    <slot />
  </div>
</template>
