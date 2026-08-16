<script setup lang="ts" vapor>
import type {HeadingProps} from "./typography.types";

import {computed} from "vue";

import TypographyRoot from "./typography-root.vue";

const props = withDefaults(defineProps<HeadingProps>(), {level: 1});

defineSlots<{default?: () => unknown}>();

const type = computed(() => `h${props.level}` as const);
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
