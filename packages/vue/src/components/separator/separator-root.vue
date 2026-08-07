<script setup lang="ts" vapor>
import type {SeparatorRootProps} from "./separator.types";

import {separatorVariants} from "@heroui/styles";
import {computed} from "vue";

const props = withDefaults(defineProps<SeparatorRootProps>(), {orientation: "horizontal"});

const styles = computed(() =>
  separatorVariants({
    class: props.class,
    orientation: props.orientation,
    variant: props.variant,
  }),
);

const isVertical = computed(() => props.orientation === "vertical");
</script>

<template>
  <!--
    A vertical rule cannot be an `hr`, so it falls back to a `div`. Both spell out
    `role="separator"` even though an `hr` implies it: React Aria emits it on the `hr` too,
    and matching it keeps the rendered markup identical across the two builds.
    `aria-orientation` is the opposite — horizontal is the ARIA default, so only the vertical
    branch declares it.
  -->
  <div
    v-if="isVertical"
    aria-orientation="vertical"
    :class="styles"
    data-orientation="vertical"
    data-slot="separator"
    role="separator"
  />
  <hr v-else :class="styles" data-orientation="horizontal" data-slot="separator" role="separator" />
</template>
