<script setup lang="ts" vapor>
import type { CardDescriptionProps } from "./card.types";

import { composeSlotClassName } from "../../utils/compose";

import { useCardContext } from "./card.context";

const props = defineProps<CardDescriptionProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useCardContext();
</script>

<template>
  <p :class="composeSlotClassName(slots.description, props.class)" data-slot="card-description">
    <slot />
  </p>
</template>
