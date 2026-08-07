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
    An `hr` already means "separator" with a horizontal orientation, so spelling either out
    would be redundant. A vertical rule cannot be an `hr`, so it falls back to a `div` that
    has to declare both.
  -->
  <div
    v-if="isVertical"
    aria-orientation="vertical"
    :class="styles"
    data-orientation="vertical"
    data-slot="separator"
    role="separator"
  />
  <hr v-else :class="styles" data-orientation="horizontal" data-slot="separator" />
</template>
