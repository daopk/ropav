<script setup lang="ts" vapor>
import type { ImageLoadingStatus } from "../../composables/use-image-loading-status";
import type { AvatarImageProps } from "./avatar.types";

import { shallowRef, watch } from "vue";

import { useImageLoadingStatus } from "../../composables/use-image-loading-status";
import { composeSlotClassName } from "../../utils/compose";

import { useAvatarContext } from "./avatar.context";

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

const { setImageStatus, slots } = useAvatarContext();

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
  { immediate: true },
);
/**
 * `alt` is set by hand because an empty one cannot be bound.
 *
 * Vapor routes it through `setDOMProp`, which returns early when the new value equals what the
 * element already reports - and an `img` carrying no `alt` attribute already reports `""`. So the
 * empty default never reaches the DOM, and the attribute stays missing altogether, which is the
 * one state that is always wrong.
 */
const image = shallowRef<HTMLImageElement | null>(null);

watch([image, () => props.alt], ([element, alt]) => element?.setAttribute("alt", alt ?? ""), {
  flush: "post",
});
</script>

<template>
  <img
    v-if="status === 'loaded'"
    :ref="(element) => (image = element as HTMLImageElement | null)"
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
