<script setup lang="ts" vapor>
import type {ParagraphProps, TypographyType} from "./typography.types";

import {computed} from "vue";

import TypographyRoot from "./typography-root.vue";

const props = withDefaults(defineProps<ParagraphProps>(), {size: "base"});

defineSlots<{default?: () => unknown}>();

const type = computed<TypographyType>(() =>
  props.size === "base" ? "body" : `body-${props.size}`,
);
</script>

<template>
  <TypographyRoot
    v-bind="{slot: props.slot}"
    :align="props.align"
    :class="props.class"
    :color="props.color"
    :truncate="props.truncate"
    :type="type"
    :weight="props.weight"
  >
    <slot />
  </TypographyRoot>
</template>
