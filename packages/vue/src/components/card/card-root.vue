<script setup lang="ts" vapor>
import type {CardRootProps} from "./card.types";

import {cardVariants} from "@heroui/styles";
import {computed} from "vue";

import {provideCardContext} from "./card.context";

const props = defineProps<CardRootProps>();

defineSlots<{default?: () => unknown}>();

const slots = computed(() => cardVariants({variant: props.variant}));

provideCardContext({slots});
</script>

<template>
  <div :class="slots.base({class: props.class})" data-slot="card">
    <slot />
  </div>
</template>
