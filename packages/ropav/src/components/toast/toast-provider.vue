<script setup lang="ts" vapor>
import type { ToastProviderProps, ToastProviderSlotProps } from "./toast.types";
import type { CSSProperties } from "vue";

import { toastVariants } from "@ropav/styles";
import { computed, shallowRef } from "vue";

import { useLocale } from "../../composables/use-locale";
import { useToastRegion } from "../../composables/use-toast-region";
import { composeSlotClassName } from "../../utils/compose";

import ToastDefaultContent from "./toast-default-content.vue";
import { toastQueue, useToastQueue } from "./toast-queue";
import {
  DEFAULT_GAP,
  DEFAULT_MAX_VISIBLE_TOAST,
  DEFAULT_SCALE_FACTOR,
  DEFAULT_TOAST_WIDTH,
} from "./toast.constants";
import { provideToastRegionContext } from "./toast.context";

const props = withDefaults(defineProps<ToastProviderProps>(), {
  gap: DEFAULT_GAP,
  placement: "bottom",
  scaleFactor: DEFAULT_SCALE_FACTOR,
  width: DEFAULT_TOAST_WIDTH,
});

defineSlots<{ default?: (props: ToastProviderSlotProps) => unknown }>();

const queue = computed(() => props.queue ?? toastQueue);

const { visibleToasts } = useToastQueue(queue);

const element = shallowRef<HTMLElement | null>(null);

const setElement = (next: unknown) => {
  element.value = (next as HTMLElement | null) ?? null;
};

const region = useToastRegion({
  ariaLabel: () => props.ariaLabel,
  elementRef: element,
  onPauseAll: () => queue.value.pauseAll(),
  onResumeAll: () => queue.value.resumeAll(),
  visibleToasts,
});

const slots = computed(() => toastVariants({ placement: props.placement }));

const locale = useLocale();

/**
 * Every toast's measured height, gathered here because no toast can see its siblings.
 *
 * A toast that is not frontmost is clipped to the front one's height, so the front toast's number
 * has to travel up and back down as `--front-height`.
 */
const heights = shallowRef<Record<string, number>>({});

provideToastRegionContext({
  close: (key) => queue.value.close(key),
  gap: computed(() => props.gap),
  heightsByKey: computed(() => heights.value),
  // The queue's own hint is the fallback, so a queue built with a limit does not need it repeated
  // on every region that renders it.
  maxVisibleToasts: computed(
    () => props.maxVisibleToasts ?? queue.value.maxVisibleToasts ?? DEFAULT_MAX_VISIBLE_TOAST,
  ),
  onToastHeightChange: (key, height) => {
    if (heights.value[key] === height) return;

    heights.value = { ...heights.value, [key]: height };
  },
  onToastHeightRemove: (key) => {
    if (!(key in heights.value)) return;

    const { [key]: _removed, ...rest } = heights.value;

    heights.value = rest;
  },
  placement: computed(() => props.placement),
  scaleFactor: computed(() => props.scaleFactor),
  slots,
  visibleToasts,
});

const target = computed(() => props.portalContainer ?? "body");

const styles = computed(() => composeSlotClassName(slots.value.region, props.class));

const regionStyle = computed<CSSProperties>(() => ({
  "--gap": `${props.gap}px`,
  "--placement": props.placement,
  "--scale-factor": props.scaleFactor,
  "--toast-width": typeof props.width === "number" ? `${props.width}px` : props.width,
}));

/**
 * The list and every row are `display: contents`, so the ordered list gives the toasts their
 * semantics without taking part in the layout the stylesheet builds out of absolute positioning.
 */
const CONTENTS_STYLE: CSSProperties = { display: "contents" };
</script>

<template>
  <Teleport v-if="visibleToasts.length > 0" :to="target">
    <div
      :ref="setElement"
      :class="styles"
      data-slot="toast-region"
      :dir="locale.direction"
      :style="regionStyle"
      v-bind="region.regionAttrs.value"
      @focusin="region.onFocusin"
      @focusout="region.onFocusout"
      @pointerenter="region.onPointerenter"
      @pointerleave="region.onPointerleave"
    >
      <ol :style="CONTENTS_STYLE">
        <li v-for="entry in visibleToasts" :key="entry.key" :style="CONTENTS_STYLE">
          <slot :is-loading="entry.content?.isLoading ?? false" :toast="entry">
            <ToastDefaultContent :toast="entry" />
          </slot>
        </li>
      </ol>
    </div>
  </Teleport>
</template>
