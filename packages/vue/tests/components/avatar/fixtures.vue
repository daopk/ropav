<script setup lang="ts" vapor>
import type {AvatarRootProps} from "@/components/avatar";

import {Avatar} from "@/components/avatar";

defineProps<AvatarRootProps & {fallbackColor?: AvatarRootProps["color"]; src?: string}>();
</script>

<template>
  <Avatar :class="$props.class" :color="$props.color" :size="$props.size" :variant="$props.variant">
    <Avatar.Image alt="Jane Doe" :src="$props.src" />
    <Avatar.Fallback :color="$props.fallbackColor">JD</Avatar.Fallback>
  </Avatar>
</template>
