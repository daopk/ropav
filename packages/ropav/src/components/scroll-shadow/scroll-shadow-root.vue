<script setup lang="ts" vapor>
import type { ScrollShadowRootProps } from "./scroll-shadow.types";

import { scrollShadowVariants } from "@ropav/styles";
import { computed, shallowRef, watch } from "vue";

import { focusableIn } from "../../utils/focus";

import { useScrollShadow } from "./use-scroll-shadow";

const props = withDefaults(defineProps<ScrollShadowRootProps>(), {
  hideScrollBar: false,
  isEnabled: true,
  offset: 0,
  orientation: "vertical",
  size: 40,
  variant: "fade",
  visibility: "auto",
});

defineSlots<{ default?: () => unknown }>();

const element = shallowRef<HTMLElement | null>(null);

// A region that scrolls has to be reachable by keyboard. When nothing inside can take focus, the
// container itself is the only place that tab stop can go.
const needsTabStop = shallowRef(false);

watch(
  element,
  (host) => {
    needsTabStop.value = Boolean(host) && focusableIn(host as HTMLElement).length === 0;
  },
  { flush: "post" },
);

const styles = computed(() =>
  scrollShadowVariants({
    hideScrollBar: props.hideScrollBar,
    orientation: props.orientation,
    variant: props.variant,
  }).base({ class: props.class }),
);

const style = computed(() => [{ "--scroll-shadow-size": `${props.size}px` }, props.style]);

const clearVisibility = (current: HTMLElement) => {
  delete current.dataset["topScroll"];
  delete current.dataset["bottomScroll"];
  delete current.dataset["topBottomScroll"];
  delete current.dataset["leftScroll"];
  delete current.dataset["rightScroll"];
  delete current.dataset["leftRightScroll"];
};

watch(
  [element, () => props.visibility, () => props.orientation],
  ([current, visibility, orientation]) => {
    if (!current || visibility === "auto") return;

    clearVisibility(current);

    if (visibility === "both") {
      current.dataset[orientation === "vertical" ? "topBottomScroll" : "leftRightScroll"] = "true";
    } else if (visibility !== "none") {
      current.dataset[`${visibility}Scroll`] = "true";
    }
  },
  { flush: "post", immediate: true },
);

const { checkOverflow } = useScrollShadow({
  container: element,
  isEnabled: () => props.isEnabled,
  offset: () => props.offset,
  onVisibilityChange: (visibility) => props.onVisibilityChange?.(visibility),
  orientation: () => props.orientation,
  visibility: () => props.visibility,
});

defineExpose({ checkOverflow, element });
</script>

<template>
  <div
    ref="element"
    :class="styles"
    :data-orientation="props.orientation"
    :data-scroll-shadow-size="props.size"
    data-slot="scroll-shadow"
    :style="style"
    :tabindex="needsTabStop ? 0 : undefined"
  >
    <slot />
  </div>
</template>
