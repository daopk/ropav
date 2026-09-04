<script setup lang="ts" vapor>
import type { AvatarProps, ImageLoadingStatus } from "@/components/avatar";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";

defineProps<
  AvatarProps & {
    alt?: string;
    delayMs?: number;
    fallbackColor?: AvatarProps["color"];
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
    <AvatarImage
      :alt="$props.alt"
      :sizes="$props.sizes"
      :src="$props.src"
      :src-set="$props.srcSet"
      @error="$emit('error', $event)"
      @load="$emit('load', $event)"
      @loading-status-change="$emit('loadingStatusChange', $event)"
    />
    <AvatarFallback :color="$props.fallbackColor" :delay-ms="$props.delayMs">JD</AvatarFallback>
  </Avatar>
</template>
