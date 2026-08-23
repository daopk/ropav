<script setup lang="ts" vapor>
import type { TypographyRootProps } from "./typography.types";

import { typographyVariants } from "@ropav/styles";
import { computed } from "vue";

import { DEFAULT_ELEMENT_BY_TYPE } from "./typography.constants";

const props = defineProps<TypographyRootProps>();

defineSlots<{ default?: () => unknown }>();

const resolvedType = computed(() => props.type ?? "body");
const tag = computed(() => DEFAULT_ELEMENT_BY_TYPE[resolvedType.value]);
const styles = computed(() =>
  typographyVariants({
    align: props.align,
    color: props.color,
    truncate: props.truncate,
    type: resolvedType.value,
    weight: props.weight,
  }).base({ class: props.class }),
);
</script>

<template>
  <component
    :is="tag"
    v-bind="{ slot: props.slot }"
    :class="styles"
    data-slot="typography"
    :data-type="resolvedType"
  >
    <slot />
  </component>
</template>
