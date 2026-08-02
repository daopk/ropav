<script setup lang="ts" vapor>
import type {CardContentProps} from "./card.types";

import {composeSlotClassName} from "../../utils/compose";

import {useCardContext} from "./card.context";

const props = defineProps<CardContentProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useCardContext();
</script>

<template>
  <div :class="composeSlotClassName(slots.content, props.class)" data-slot="card-content">
    <slot />
  </div>
</template>
