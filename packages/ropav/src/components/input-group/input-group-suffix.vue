<script setup lang="ts" vapor>
import type { InputGroupSuffixProps } from "./input-group.types";

const props = defineProps<InputGroupSuffixProps>();
</script>

<template>
  <div :class="['rp-input-group__suffix', props.class]" data-slot="input-group-suffix">
    <slot />
  </div>
</template>
