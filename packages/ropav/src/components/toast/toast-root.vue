<script setup lang="ts" vapor>
import type {ToastRootProps} from "./toast.types";
import type {CSSProperties} from "vue";

import {computed, onScopeDispose, shallowRef, watch} from "vue";

import {useMeasuredHeight} from "../../composables/use-measured-height";
import {useToast} from "../../composables/use-toast";
import {dataAttr} from "../../utils/assertion";
import {provideSurfaceContext} from "../surface";

import {provideToastItemContext, useToastRegionContext} from "./toast.context";

const props = defineProps<ToastRootProps>();

defineSlots<{default?: () => unknown}>();

const region = useToastRegionContext();

const element = shallowRef<HTMLElement | null>(null);

const setElement = (next: unknown) => {
  element.value = (next as HTMLElement | null) ?? null;
};

const placement = computed(() => props.placement ?? region.placement.value);
const scaleFactor = computed(() => props.scaleFactor ?? region.scaleFactor.value);

/** Index 0 is the newest toast, which is the one in front of the stack. */
const index = computed(() =>
  region.visibleToasts.value.findIndex((entry) => entry.key === props.toast.key),
);

const isFrontmost = computed(() => index.value <= 0);
const isHidden = computed(() => index.value >= region.maxVisibleToasts.value);

const {height} = useMeasuredHeight(element);

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
  {immediate: true},
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
provideSurfaceContext({variant: computed(() => "default" as const)});

const styles = computed(() =>
  region.slots.value.toast({
    class: props.class,
    placement: placement.value,
    variant: props.variant,
  }),
);

const style = computed<CSSProperties>(() => {
  const visible = region.visibleToasts.value;
  const frontKey = visible[0]?.key;
  const frontHeight =
    (frontKey === undefined ? undefined : region.heightsByKey.value[frontKey]) ?? height.value ?? 0;

  // A bottom stack grows upwards away from the edge it is pinned to, a top stack downwards.
  const offset = index.value * region.gap.value;
  const direction = placement.value?.startsWith("bottom") ? -1 : 1;

  return {
    opacity: isHidden.value ? 0 : 1,
    pointerEvents: isHidden.value ? ("none" as const) : ("auto" as const),
    scale: `${1 - index.value * scaleFactor.value}`,
    translate: `0 ${direction * offset}px 0`,
    // Names this toast for the view transition that animates it in and out. The key is not a valid
    // custom-ident on its own.
    viewTransitionName: `toast-${props.toast.key.replace(/[^a-zA-Z0-9]/g, "-")}`,
    zIndex: visible.length - index.value,
    ...(frontHeight ? {"--front-height": `${frontHeight}px`} : null),
  };
});
</script>

<template>
  <div
    :ref="setElement"
    :class="styles"
    :data-frontmost="dataAttr(isFrontmost)"
    :data-hidden="dataAttr(isHidden)"
    :data-index="index"
    data-slot="toast"
    :style="style"
    :tabindex="isFrontmost ? 0 : -1"
    v-bind="api.toastAttrs.value"
  >
    <slot />
  </div>
</template>
