<script setup lang="ts" vapor>
import type { CardTitleProps } from "./card.types";

const props = defineProps<CardTitleProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <h3 :class="['rp-card__title', props.class]" data-slot="card-title">
    <slot />
  </h3>
</template>
