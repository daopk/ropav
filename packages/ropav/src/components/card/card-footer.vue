<script setup lang="ts" vapor>
import type { CardFooterProps } from "./card.types";

import { composeSlotClassName } from "../../utils/compose";

import { useCardContext } from "./card.context";

const props = defineProps<CardFooterProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useCardContext();
</script>

<template>
  <div :class="composeSlotClassName(slots.footer, props.class)" data-slot="card-footer">
    <slot />
  </div>
</template>
