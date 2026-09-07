<script setup lang="ts" vapor>
import type { CardContentProps } from "./card.types";

const props = defineProps<CardContentProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-card__content', props.class]" data-slot="card-content">
    <slot />
  </div>
</template>
