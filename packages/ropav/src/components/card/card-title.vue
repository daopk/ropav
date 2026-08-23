<script setup lang="ts" vapor>
import type { CardTitleProps } from "./card.types";

import { composeSlotClassName } from "../../utils/compose";

import { useCardContext } from "./card.context";

const props = defineProps<CardTitleProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useCardContext();
</script>

<template>
  <h3 :class="composeSlotClassName(slots.title, props.class)" data-slot="card-title">
    <slot />
  </h3>
</template>
