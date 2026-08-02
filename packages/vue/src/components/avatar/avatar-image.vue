<script setup lang="ts" vapor>
import type {AvatarImageProps} from "./avatar.types";

import {watch} from "vue";

import {useImageLoadingStatus} from "../../composables/use-image-loading-status";
import {composeSlotClassName} from "../../utils/compose";

import {useAvatarContext} from "./avatar.context";

const props = defineProps<AvatarImageProps>();

const emit = defineEmits<{error: []; load: []}>();

const {setImageStatus, slots} = useAvatarContext();

const status = useImageLoadingStatus(() => props.src, {
  crossOrigin: () => props.crossOrigin,
  referrerPolicy: () => props.referrerPolicy,
});

watch(
  status,
  (value) => {
    // Publish upwards so the fallback renders until the image is actually usable.
    setImageStatus(value);

    if (value === "loaded") emit("load");
    if (value === "error") emit("error");
  },
  {immediate: true},
);
</script>

<template>
  <img
    v-if="status === 'loaded'"
    :alt="props.alt"
    :class="composeSlotClassName(slots.image, props.class)"
    :crossorigin="props.crossOrigin"
    :loading="props.loading"
    :referrerpolicy="props.referrerPolicy"
    :sizes="props.sizes"
    :src="props.src"
    :srcset="props.srcset"
  />
</template>
