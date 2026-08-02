<script setup lang="ts" vapor>
import type {AvatarRootProps} from "./avatar.types";
import type {ImageLoadingStatus} from "../../composables/use-image-loading-status";

import {avatarVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {provideAvatarContext} from "./avatar.context";

const props = defineProps<AvatarRootProps>();

defineSlots<{default?: () => unknown}>();

const slots = computed(() =>
  avatarVariants({color: props.color, size: props.size, variant: props.variant}),
);

// Held on the root so the fallback can react to what the image reports.
const imageStatus = shallowRef<ImageLoadingStatus>("idle");

const setImageStatus = (status: ImageLoadingStatus) => {
  imageStatus.value = status;
};

provideAvatarContext({imageStatus, setImageStatus, slots});
</script>

<template>
  <span :class="slots.base({class: props.class})">
    <slot />
  </span>
</template>
