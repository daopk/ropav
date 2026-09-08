<script setup lang="ts" vapor>
import type { ImageLoadingStatus } from "../../composables/use-image-loading-status";
import type { AvatarRootProps } from "./avatar.types";

import { avatarVariants } from "@ropav/styles";
import { computed, shallowRef } from "vue";

import { useAvatarGroupContext } from "../avatar-group/avatar-group.context";

import { provideAvatarContext } from "./avatar.context";

const props = defineProps<AvatarRootProps>();

defineSlots<{ default?: () => unknown }>();

const group = useAvatarGroupContext();

// Named apart from the prop it resolves: a binding that shadows a prop name is read as the prop
// inside the template, which would silently drop the size coming from the group.
const resolvedSize = computed(() => props.size ?? group?.size.value);

const slots = computed(() =>
  avatarVariants({ color: props.color, size: resolvedSize.value, variant: props.variant }),
);

// Held on the root so the fallback can react to what the image reports.
const imageStatus = shallowRef<ImageLoadingStatus>("idle");

const setImageStatus = (status: ImageLoadingStatus) => {
  imageStatus.value = status;
};

provideAvatarContext({ imageStatus, setImageStatus, slots });
</script>

<template>
  <span :class="slots.base({ class: props.class })">
    <slot />
  </span>
</template>
