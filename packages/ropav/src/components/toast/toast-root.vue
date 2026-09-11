<script setup lang="ts" vapor>
import type { ToastRootProps } from "./toast.types";
import type { CSSProperties } from "vue";

import { computed, onMounted, onScopeDispose, shallowRef, watch } from "vue";

import { useMeasuredHeight } from "../../composables/use-measured-height";
import { useToast } from "../../composables/use-toast";
import { createAnimationSettleWaiter } from "../../utils/animation-settled";
import { dataAttr } from "../../utils/assertion";
import { provideSurfaceContext } from "../surface";

import { provideToastItemContext, useToastRegionContext } from "./toast.context";

const props = defineProps<ToastRootProps>();

defineSlots<{ default?: () => unknown }>();

const region = useToastRegionContext();

const element = shallowRef<HTMLElement | null>(null);

const setElement = (next: unknown) => {
  element.value = (next as HTMLElement | null) ?? null;
};

const placement = computed(() => props.placement ?? region.placement.value);
const scaleFactor = computed(() => props.scaleFactor ?? region.scaleFactor.value);

const isExiting = computed(() => region.exitingKeys.value.has(props.toast.key));

/**
 * The place this toast holds in the stack. Index 0 is the newest, which is the one in front.
 *
 * A toast on its way out keeps the slot it had while the ones behind it renumber and close up,
 * so the stack reflows around it instead of waiting for it to finish.
 */
const lastIndex = shallowRef(0);

const index = computed(() => {
  if (isExiting.value) return lastIndex.value;

  return Math.max(
    region.visibleToasts.value.findIndex((entry) => entry.key === props.toast.key),
    0,
  );
});

watch(
  index,
  (next) => {
    if (!isExiting.value) lastIndex.value = next;
  },
  { immediate: true },
);

const isFrontmost = computed(() => index.value <= 0);
const isHidden = computed(() => !isExiting.value && index.value >= region.maxVisibleToasts.value);

/**
 * Rendered from the very first frame rather than set once mounted.
 *
 * A transition needs a style to leave, so the offset has to be the element's *first* resolved
 * style. Written after the element already exists, the browser transitions towards the offset and
 * the flip below then drags it back — which reads as a toast that twitches instead of arriving.
 */
const isEntering = shallowRef(true);

onMounted(() => {
  // Two frames: the first is the one the element appears in, and a style that has never been
  // painted is not one a transition can start from.
  let inner = 0;
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(() => {
      isEntering.value = false;
    });
  });

  onScopeDispose(() => {
    cancelAnimationFrame(outer);
    cancelAnimationFrame(inner);
  }, true);
});

/**
 * The exit is waited for rather than timed, so its length lives in the stylesheet — the one place
 * that knows it — and no number here can fall out of step with it.
 */
const exit = createAnimationSettleWaiter(() => element.value);

watch(isExiting, (exiting) => {
  if (!exiting) return;

  exit.whenSettled(() => region.onExitFinished(props.toast.key));
});

onScopeDispose(exit.cancel, true);

const { height } = useMeasuredHeight(element);

/**
 * Every toast reports its height up, because a toast that is *not* frontmost is clipped to the
 * height of the one that is — `toast.css` sizes it from `--front-height`, and only the region sees
 * all of them.
 */
watch(
  [() => props.toast.key, height],
  ([key, next]) => {
    if (typeof next === "number") region.onToastHeightChange(key, next);
  },
  { immediate: true },
);

watch(
  () => props.toast.key,
  (_key, previous) => {
    if (previous !== undefined) region.onToastHeightRemove(previous);
  },
);

onScopeDispose(() => {
  region.onToastHeightRemove(props.toast.key);
});

const api = useToast({
  onClose: () => region.close(props.toast.key),
  timeout: () => props.toast.timeout,
  timer: () => props.toast.timer,
});

provideToastItemContext({
  close: api.close,
  contentAttrs: api.contentAttrs,
  descriptionAttrs: api.descriptionAttrs,
  registerDescription: api.registerDescription,
  titleAttrs: api.titleAttrs,
  variant: computed(() => props.variant),
});

// A toast is a surface in its own right, so descendants use their default on-surface colours.
provideSurfaceContext({ variant: computed(() => "default" as const) });

const styles = computed(() =>
  region.slots.value.toast({
    class: props.class,
    placement: placement.value,
    variant: props.variant,
  }),
);

const style = computed<CSSProperties>(() => {
  const visible = region.visibleToasts.value;
  const heights = region.heightsByKey.value;
  const frontKey = visible[0]?.key;
  const frontHeight = (frontKey === undefined ? undefined : heights[frontKey]) ?? height.value ?? 0;

  // Opened out, a toast sits past the full height of everything in front of it rather than past a
  // fixed step — which is the only reason each toast's own height has to travel up to the region.
  let heightsBefore = 0;

  for (let position = 0; position < index.value; position += 1) {
    const key = visible[position]?.key;

    heightsBefore += (key === undefined ? undefined : heights[key]) ?? frontHeight;
  }

  const gap = index.value * region.gap.value;

  return {
    "--front-height": `${frontHeight}px`,
    "--offset-collapsed": `${gap}px`,
    "--offset-expanded": `${heightsBefore + gap}px`,
    "--scale-collapsed": `${1 - index.value * scaleFactor.value}`,
    // A toast on its way out is under everything: it is leaving, and nothing behind it should be
    // covered by a ghost while the stack closes up.
    zIndex: isExiting.value ? 0 : visible.length - index.value,
    ...(height.value === undefined ? null : { "--toast-height": `${height.value}px` }),
  };
});
</script>

<template>
  <div
    :ref="setElement"
    :class="styles"
    :data-entering="dataAttr(isEntering)"
    :data-exiting="dataAttr(isExiting)"
    :data-expanded="dataAttr(region.isExpanded.value)"
    :data-frontmost="dataAttr(isFrontmost)"
    :data-hidden="dataAttr(isHidden)"
    :data-index="index"
    data-slot="toast"
    :style="style"
    :tabindex="isFrontmost && !isExiting ? 0 : -1"
    v-bind="api.toastAttrs.value"
  >
    <slot />
  </div>
</template>
