<script setup lang="ts" vapor>
import type {AvatarRootProps, ImageLoadingStatus} from "@/components/avatar";

import {Avatar} from "@/components/avatar";

defineProps<AvatarRootProps & {fallbackColor?: AvatarRootProps["color"]; src?: string}>();

defineEmits<{
  error: [event: Event];
  load: [event: Event];
  loadingStatusChange: [status: ImageLoadingStatus];
}>();
</script>

<template>
  <Avatar :class="$props.class" :color="$props.color" :size="$props.size" :variant="$props.variant">
    <Avatar.Image
      alt="Jane Doe"
      :src="$props.src"
      @error="$emit('error', $event)"
      @load="$emit('load', $event)"
      @loading-status-change="$emit('loadingStatusChange', $event)"
    />
    <Avatar.Fallback :color="$props.fallbackColor">JD</Avatar.Fallback>
  </Avatar>
</template>
