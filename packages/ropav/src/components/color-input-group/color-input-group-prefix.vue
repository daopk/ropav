<script setup lang="ts" vapor>
import type { ColorInputGroupPrefixProps } from "./color-input-group.types";

const props = defineProps<ColorInputGroupPrefixProps>();
</script>

<template>
  <div :class="['rp-color-input-group__prefix', props.class]" data-slot="color-input-group-prefix">
    <slot />
  </div>
</template>
