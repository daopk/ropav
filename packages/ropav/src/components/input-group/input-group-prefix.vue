<script setup lang="ts" vapor>
import type { InputGroupPrefixProps } from "./input-group.types";

const props = defineProps<InputGroupPrefixProps>();
</script>

<template>
  <div :class="['rp-input-group__prefix', props.class]" data-slot="input-group-prefix">
    <slot />
  </div>
</template>
