<script setup lang="ts" vapor>
import type {AvatarImageProps} from "./avatar.types";
import type {ImageLoadingStatus} from "../../composables/use-image-loading-status";

import {watch} from "vue";

import {useImageLoadingStatus} from "../../composables/use-image-loading-status";
import {composeSlotClassName} from "../../utils/compose";

import {useAvatarContext} from "./avatar.context";

const props = defineProps<AvatarImageProps>();

/**
 * `load` and `error` come from the rendered `<img>`, so they carry a real event and cannot
 * fire when there is no element to fire them — a missing `src` reports nothing. The probe's
 * verdict is a separate channel, because it is the only one that speaks before the element
 * exists, and so the only one that can report a failure at all.
 */
const emit = defineEmits<{
  error: [event: Event];
  load: [event: Event];
  loadingStatusChange: [status: ImageLoadingStatus];
}>();

const {setImageStatus, slots} = useAvatarContext();

const status = useImageLoadingStatus(() => props.src, {
  crossOrigin: () => props.crossOrigin,
  referrerPolicy: () => props.referrerPolicy,
});

watch(
  status,
  (value) => {
    // "idle" means the probe never ran because there is no DOM. That is not a verdict about
    // the image, so nobody hears about it.
    if (value === "idle") return;

    // Publish upwards so the fallback renders until the image is actually usable.
    setImageStatus(value);
    emit("loadingStatusChange", value);
  },
  // A cached image resolves synchronously, so without this the one status that matters most
  // would be the one nobody is told about.
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
    :srcset="props.srcSet"
    @error="emit('error', $event)"
    @load="emit('load', $event)"
  />
</template>
