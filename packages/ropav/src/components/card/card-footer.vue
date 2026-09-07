<script setup lang="ts" vapor>
import type { CardFooterProps } from "./card.types";

const props = defineProps<CardFooterProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-card__footer', props.class]" data-slot="card-footer">
    <slot />
  </div>
</template>
