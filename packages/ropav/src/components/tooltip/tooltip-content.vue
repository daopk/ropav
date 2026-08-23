<script setup lang="ts" vapor>
import type {TooltipContentProps} from "./tooltip.types";

import {computed, shallowRef} from "vue";

import {useEnterExit} from "../../composables/use-enter-exit";
import {useOverlayPosition} from "../../composables/use-overlay-position";
import {dataAttr} from "../../utils/assertion";
import {provideOverlayArrowContext} from "../overlay";

import {useTooltipContext} from "./tooltip.context";

// The three-state booleans declare an explicit `undefined` default so an absent prop stays absent
// rather than reading as an explicit `false`.
const props = withDefaults(defineProps<TooltipContentProps>(), {
  isEntering: undefined,
  isExiting: undefined,
  shouldFlip: undefined,
  showArrow: false,
});

defineSlots<{default?: () => unknown}>();

const {shouldSkipAnimation, slots, state, tooltipId, triggerElement} = useTooltipContext();

const element = shallowRef<HTMLElement | null>(null);
const arrow = shallowRef<Element | null>(null);

/**
 * Built straight on the positioner rather than on the shared overlay primitive.
 *
 * A tooltip is not a thing you go inside: nothing in it takes focus, nothing dismisses it by
 * clicking away, the page behind it stays live and stays scrollable, and it is never hidden from
 * assistive technology because it *is* the description. All of that is what the primitive adds, so
 * going through it would mean turning every part of it off. React Aria draws the line in the same
 * place — its tooltip does not go through `usePopover` either.
 */
const {arrowStyle, overlayStyle, placement} = useOverlayPosition({
  arrowBoundaryOffset: () => props.arrowBoundaryOffset,
  arrowRef: arrow,
  containerPadding: () => props.containerPadding,
  crossOffset: () => props.crossOffset,
  isOpen: () => state.isOpen.value,
  // Room for the arrow, which is a wider gap than the tooltip needs on its own.
  offset: () => props.offset ?? (props.showArrow ? 7 : 3),
  // Instantly: a scroll has moved the trigger out from under the tooltip, and a description
  // pointing at nothing is worse than none.
  onClose: () => state.close(true),
  overlayRef: element,
  placement: () => props.placement ?? "top",
  shouldFlip: () => props.shouldFlip,
  targetRef: triggerElement,
});

provideOverlayArrowContext({
  placement,
  registerElement: (next) => {
    arrow.value = next;
  },
  style: arrowStyle,
});

// Held in the DOM through the exit animation, which is otherwise a contradiction: the tooltip has
// to be gone and has to still be there to animate.
const enterExit = useEnterExit({
  elementRef: element,
  isOpen: () => state.isOpen.value,
  // Animating before the tooltip has been placed would slide it in from wherever it was first laid
  // out rather than from its trigger.
  isReady: () => placement.value !== null,
});

const isEntering = computed(
  () => props.isEntering ?? (!shouldSkipAnimation.value && enterExit.isEntering.value),
);
const isExiting = computed(
  () => props.isExiting ?? (!shouldSkipAnimation.value && enterExit.isExiting.value),
);
const isPresent = computed(
  () => state.isOpen.value || enterExit.isExiting.value || props.isExiting === true,
);

const styles = computed(() => slots.value.base({class: props.class}));

const target = computed(() => props.portalContainer ?? "body");

const setElement = (next: unknown) => {
  element.value = (next as HTMLElement | null) ?? null;
};

/**
 * Hovering the tooltip itself keeps it open.
 *
 * Not for reading it — a tooltip is not reachable that way — but because the gap between trigger
 * and tooltip is small enough that a pointer travelling to whatever sits beyond it clips the
 * tooltip on the way, and closing on that reads as the label flinching away.
 */
const onPointerenter = () => state.open(true);
const onPointerleave = () => state.close();
</script>

<template>
  <Teleport v-if="isPresent" :to="target">
    <div
      :id="tooltipId"
      :ref="setElement"
      :class="styles"
      :data-entering="dataAttr(isEntering)"
      :data-exiting="dataAttr(isExiting)"
      :data-placement="placement ?? undefined"
      role="tooltip"
      :style="overlayStyle"
      @pointerenter="onPointerenter"
      @pointerleave="onPointerleave"
    >
      <slot />
    </div>
  </Teleport>
</template>
