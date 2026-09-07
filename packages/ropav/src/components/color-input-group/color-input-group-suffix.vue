<script setup lang="ts" vapor>
import type { ColorInputGroupSuffixProps } from "./color-input-group.types";

const props = defineProps<ColorInputGroupSuffixProps>();
</script>

<template>
  <div :class="['rp-color-input-group__suffix', props.class]" data-slot="color-input-group-suffix">
    <slot />
  </div>
</template>
