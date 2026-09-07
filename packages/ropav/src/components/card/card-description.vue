<script setup lang="ts" vapor>
import type { CardDescriptionProps } from "./card.types";

const props = defineProps<CardDescriptionProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <p :class="['rp-card__description', props.class]" data-slot="card-description">
    <slot />
  </p>
</template>
