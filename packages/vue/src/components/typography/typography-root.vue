<script setup lang="ts" vapor>
import type {TypographyRootProps, TypographyType} from "./typography.types";

import {typographyVariants} from "@heroui/styles";
import {computed} from "vue";

const props = defineProps<TypographyRootProps>();

defineSlots<{default?: () => unknown}>();

const defaultElementByType: Record<TypographyType, string> = {
  body: "p",
  "body-sm": "p",
  "body-xs": "p",
  code: "code",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
};

const resolvedType = computed(() => props.type ?? "body");
const tag = computed(() => defaultElementByType[resolvedType.value]);
const styles = computed(() =>
  typographyVariants({
    align: props.align,
    color: props.color,
    truncate: props.truncate,
    type: resolvedType.value,
    weight: props.weight,
  }).base({class: props.class}),
);
</script>

<template>
  <component :is="tag" :class="styles" data-slot="typography" :data-type="resolvedType">
    <slot />
  </component>
</template>
