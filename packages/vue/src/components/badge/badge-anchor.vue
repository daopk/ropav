<script setup lang="ts" vapor>
import type {BadgeAnchorProps} from "./badge.types";

import {badgeVariants} from "@heroui/styles";
import {computed} from "vue";

const props = defineProps<BadgeAnchorProps>();

defineSlots<{default?: () => unknown}>();

const styles = computed(() => badgeVariants().anchor({class: props.class}));
</script>

<template>
  <span :class="styles" data-slot="badge-anchor">
    <slot />
  </span>
</template>
