<script setup lang="ts" vapor>
import type { AvatarGroupRootProps } from "./avatar-group.types";

import { avatarGroupVariants } from "@ropav/styles";
import { computed } from "vue";

import { provideAvatarGroupContext } from "./avatar-group.context";

const props = defineProps<AvatarGroupRootProps>();

defineSlots<{ default?: () => unknown }>();

const slots = computed(() =>
  avatarGroupVariants({
    front: props.front,
    orientation: props.orientation,
    overlap: props.overlap,
    size: props.size,
  }),
);

provideAvatarGroupContext({ size: computed(() => props.size), slots });
</script>

<template>
  <div :class="slots.base({ class: props.class })" data-slot="avatar-group">
    <slot />
  </div>
</template>
