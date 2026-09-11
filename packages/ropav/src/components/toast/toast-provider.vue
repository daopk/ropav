<script setup lang="ts" vapor>
import type { QueuedToast, ToastProviderProps, ToastProviderSlotProps } from "./toast.types";
import type { CSSProperties } from "vue";

import { toastVariants } from "@ropav/styles";
import { computed, onScopeDispose, shallowRef, watch } from "vue";

import { useLocale } from "../../composables/use-locale";
import { useToastRegion } from "../../composables/use-toast-region";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import ToastDefaultContent from "./toast-default-content.vue";
import { toastQueue, useToastQueue } from "./toast-queue";
import {
  DEFAULT_GAP,
  DEFAULT_MAX_VISIBLE_TOAST,
  DEFAULT_SCALE_FACTOR,
  DEFAULT_TOAST_WIDTH,
  EXIT_FALLBACK,
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

/**
 * Toasts the queue has let go of that are still on screen playing their exit.
 *
 * Held here rather than in the queue because it is a rendering concern: the queue's job ends when
 * a toast is closed, and a caller reading `visibleToasts` should not be told about one that is
 * only still there to finish animating.
 */
const exiting = shallowRef<QueuedToast[]>([]);

/**
 * Timeouts that let a held toast go even if it never reports its exit.
 *
 * A backstop rather than the length of the animation, which the toast itself waits out: the
 * provider's slot is the caller's to fill, and a slot that renders its own markup instead of a
 * `ToastRoot` has nothing that would ever report. Without this, every closed toast would stay in
 * the list for the life of the page.
 */
const exitFallbacks = new Map<string, ReturnType<typeof setTimeout>>();

const release = (key: string) => {
  clearTimeout(exitFallbacks.get(key));
  exitFallbacks.delete(key);
  exiting.value = exiting.value.filter((entry) => entry.key !== key);
};

watch(visibleToasts, (next, previous) => {
  if (!previous) return;

  const live = new Set(next.map((entry) => entry.key));
  const gone = previous.filter((entry) => !live.has(entry.key));

  if (gone.length === 0) return;

  exiting.value = [...exiting.value, ...gone];

  for (const entry of gone) {
    exitFallbacks.set(
      entry.key,
      setTimeout(() => release(entry.key), EXIT_FALLBACK),
    );
  }
});

onScopeDispose(() => {
  for (const timeout of exitFallbacks.values()) clearTimeout(timeout);

  exitFallbacks.clear();
});

const exitingKeys = computed(() => new Set(exiting.value.map((entry) => entry.key)));

/** Exiting toasts sit after the live ones; each one carries the slot it had through its own style. */
const renderedToasts = computed(() => [...visibleToasts.value, ...exiting.value]);

const element = shallowRef<HTMLElement | null>(null);

const setElement = (next: unknown) => {
  element.value = (next as HTMLElement | null) ?? null;
};

const region = useToastRegion({
  ariaLabel: () => props.ariaLabel,
  elementRef: element,
  hotkey: () => props.hotkey,
  isExpanded: () => props.isExpanded,
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
  exitingKeys,
  gap: computed(() => props.gap),
  heightsByKey: computed(() => heights.value),
  isExpanded: region.isExpanded,
  // The queue's own hint is the fallback, so a queue built with a limit does not need it repeated
  // on every region that renders it.
  maxVisibleToasts: computed(
    () => props.maxVisibleToasts ?? queue.value.maxVisibleToasts ?? DEFAULT_MAX_VISIBLE_TOAST,
  ),
  onExitFinished: release,
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
  <Teleport v-if="renderedToasts.length > 0" :to="target">
    <div
      :ref="setElement"
      :class="styles"
      :data-expanded="dataAttr(region.isExpanded.value)"
      data-slot="toast-region"
      :dir="locale.direction"
      :style="regionStyle"
      v-bind="region.regionAttrs.value"
      @focusin="region.onFocusin"
      @focusout="region.onFocusout"
      @pointerenter="region.onPointerenter"
      @pointerleave="region.onPointerleave"
      @pointermove="region.onPointermove"
    >
      <ol :style="CONTENTS_STYLE">
        <li v-for="entry in renderedToasts" :key="entry.key" :style="CONTENTS_STYLE">
          <slot :is-loading="entry.content?.isLoading ?? false" :toast="entry">
            <ToastDefaultContent :toast="entry" />
          </slot>
        </li>
      </ol>
    </div>
  </Teleport>
</template>
