<script setup lang="ts" vapor>
import type { CardHeaderProps } from "./card.types";

const props = defineProps<CardHeaderProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-card__header', props.class]" data-slot="card-header">
    <slot />
  </div>
</template>
