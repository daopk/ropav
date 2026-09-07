<script setup lang="ts" vapor>
import type { KbdContentProps } from "./kbd.types";

const props = defineProps<KbdContentProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span :class="['rp-kbd__content', props.class]">
    <slot />
  </span>
</template>
