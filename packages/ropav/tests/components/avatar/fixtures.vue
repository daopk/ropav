<script setup lang="ts" vapor>
import type { AvatarRootProps, ImageLoadingStatus } from "@/components/avatar";

import { Avatar } from "@/components/avatar";

defineProps<
  AvatarRootProps & {
    alt?: string;
    delayMs?: number;
    fallbackColor?: AvatarRootProps["color"];
    sizes?: string;
    src?: string;
    srcSet?: string;
  }
>();

defineEmits<{
  error: [event: Event];
  load: [event: Event];
  loadingStatusChange: [status: ImageLoadingStatus];
}>();
</script>

<template>
  <Avatar :class="$props.class" :color="$props.color" :size="$props.size" :variant="$props.variant">
    <Avatar.Image
      :alt="$props.alt"
      :sizes="$props.sizes"
      :src="$props.src"
      :src-set="$props.srcSet"
      @error="$emit('error', $event)"
      @load="$emit('load', $event)"
      @loading-status-change="$emit('loadingStatusChange', $event)"
    />
    <Avatar.Fallback :color="$props.fallbackColor" :delay-ms="$props.delayMs">JD</Avatar.Fallback>
  </Avatar>
</template>
