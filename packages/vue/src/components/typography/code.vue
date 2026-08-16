<script setup lang="ts" vapor>
import type {CodeProps} from "./typography.types";

import TypographyRoot from "./typography-root.vue";

const props = defineProps<CodeProps>();

defineSlots<{default?: () => unknown}>();
</script>

<template>
  <TypographyRoot
    :align="props.align"
    :class="props.class"
    :color="props.color"
    :truncate="props.truncate"
    type="code"
    :weight="props.weight"
  >
    <slot />
  </TypographyRoot>
</template>
