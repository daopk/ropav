<script setup lang="ts" vapor>
import type { OverlayArrowProps } from "./overlay.types";

import { computed } from "vue";

import { useOverlayArrowContext } from "./overlay.context";

const props = defineProps<OverlayArrowProps>();

defineSlots<{ default?: () => unknown }>();

const arrow = useOverlayArrowContext();

const setElement = (next: unknown) => {
  arrow?.registerElement((next as Element | null) ?? null);
};

const placement = computed(() => arrow?.placement.value ?? null);

/**
 * Pinned to the edge the overlay is placed against, and centred on the offset the positioner
 * worked out.
 *
 * The offset names the arrow's centre, so it is pulled back by half its own size on the cross
 * axis — done with a transform rather than arithmetic because only the stylesheet knows how big
 * the arrow is.
 */
const style = computed<Record<string, string>>(() => {
  const side = placement.value;
  const isVertical = side === "top" || side === "bottom";

  return {
    position: "absolute",
    transform: isVertical ? "translateX(-50%)" : "translateY(-50%)",
    ...(side ? { [side]: "100%" } : {}),
    ...(arrow?.style.value ?? {}),
  };
});
</script>

<template>
  <div
    :ref="setElement"
    :class="props.class"
    :data-placement="placement ?? undefined"
    :style="style"
  >
    <slot />
  </div>
</template>
