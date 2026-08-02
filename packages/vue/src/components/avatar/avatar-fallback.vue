<script setup lang="ts" vapor>
import type {AvatarFallbackProps} from "./avatar.types";

import {composeSlotClassName} from "../../utils/compose";

import {useAvatarContext} from "./avatar.context";

const props = defineProps<AvatarFallbackProps>();

defineSlots<{default?: () => unknown}>();

const {imageStatus, slots} = useAvatarContext();
</script>

<template>
  <span
    v-if="imageStatus !== 'loaded'"
    :class="composeSlotClassName(slots.fallback, props.class, {color: props.color})"
    data-slot="avatar-fallback"
  >
    <slot />
  </span>
</template>
