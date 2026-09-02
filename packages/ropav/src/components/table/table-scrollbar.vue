<script setup lang="ts" vapor>
import type { Size } from "../../utils/virtualizer-geometry";

import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { useMove } from "../../composables/use-move";
import { dataAttr } from "../../utils/assertion";

import { useTableContext, useTableVirtualizerContext } from "./table.context";

/**
 * One axis of the scrollbar a windowed table draws for itself, in place of the native one it hides.
 *
 * A native thumb is moved by the compositor, which draws every frame at the new offset with
 * whatever rows the main thread last committed — and across a long collection those rows are
 * always somewhere else, so the body is empty for as long as the main thread takes to catch up.
 * This thumb is moved by the main thread: a pointer move sets the offset and the rows for it in
 * one task, so no frame is ever drawn with rows that were built for another offset.
 *
 * A pointer affordance and nothing more, like the native one: the box stays the focusable
 * scroller, the keyboard reaches every offset through the grid, and the wheel still scrolls it
 * natively. Hidden from assistive technology for the same reason a native scrollbar is not exposed.
 */
const props = defineProps<{ orientation: "horizontal" | "vertical" }>();

/** How thick the bar is, across its axis. */
const THICKNESS = 10;

/** The shortest the thumb gets: a long collection would otherwise leave nothing to grab. */
const MIN_THUMB_LENGTH = 32;

/**
 * How much of the viewport a press on the track moves by. Less than the whole of it, so what was
 * at the edge is still on screen afterwards to hold the eye — the fraction browsers page by.
 */
const PAGE_FRACTION = 0.875;

const { slots } = useTableContext();
const virtualizer = useTableVirtualizerContext();

if (!virtualizer) {
  throw new Error("`TableScrollbar` was rendered outside of a windowed table.");
}

const { scroll } = virtualizer;

const isVertical = props.orientation === "vertical";

/** A size measured along this bar's axis. */
const along = (size: Size) => (isVertical ? size.height : size.width);

/** A size measured across it, which is the other bar's axis. */
const across = (size: Size) => (isVertical ? size.width : size.height);

const viewport = computed(() => along(scroll.size.value));

/** How far the box can scroll along this axis. */
const range = computed(() => Math.max(0, along(scroll.scrollSize.value) - viewport.value));

/** Whether the other axis overflows too, which is when the two bars leave each other a corner. */
const hasCorner = computed(() => across(scroll.scrollSize.value) > across(scroll.size.value));

const trackLength = computed(() => Math.max(0, viewport.value - (hasCorner.value ? THICKNESS : 0)));

/** The thumb is to the track what the viewport is to the content, down to a graspable floor. */
const thumbLength = computed(() => {
  const total = along(scroll.scrollSize.value);

  if (total <= 0) return trackLength.value;

  return Math.min(
    trackLength.value,
    Math.max(MIN_THUMB_LENGTH, (trackLength.value * viewport.value) / total),
  );
});

/** How far the thumb can travel. */
const travel = computed(() => Math.max(0, trackLength.value - thumbLength.value));

/** The scroll offset along this axis, signed. */
const offset = computed(() => (isVertical ? scroll.offset.value.y : scroll.offset.value.x));

/** Where the thumb sits, measured from the start of the track. */
const thumbOffset = computed(() =>
  range.value > 0
    ? (Math.min(Math.abs(offset.value), range.value) / range.value) * travel.value
    : 0,
);

const isVisible = computed(() => range.value > 0);

const scrollTo = (value: number) => {
  scroll.scrollTo(isVertical ? { top: value } : { left: value });
};

const states = useInteractionStates();

/* -------------------------------------------------------------------------------------------------
 * Dragging the thumb
 * -----------------------------------------------------------------------------------------------*/

/** The offset the press started from, and how far the pointer has travelled along the bar since. */
let startOffset = 0;
let dragged = 0;

/** Content pixels per thumb pixel, fixed at the press so the mapping cannot drift mid-drag. */
let ratio = 0;

const { handlers: moveHandlers } = useMove({
  onMove: ({ deltaX, deltaY }) => {
    dragged += isVertical ? deltaY : deltaX;

    // From where the press started rather than by each delta: past either end the browser clamps
    // the offset, and the thumb has to stay put until the pointer comes back to where it left it.
    // The same sum serves a right-to-left box, whose offset runs negative and grows towards zero
    // as the pointer moves the thumb towards the start.
    scrollTo(startOffset + dragged * ratio);
  },
  onMoveEnd: () => {
    dragged = 0;
  },
});

const onThumbPointerdown = (event: PointerEvent) => {
  if (event.button !== 0) return;

  startOffset = offset.value;
  dragged = 0;
  ratio = travel.value > 0 ? range.value / travel.value : 0;

  states.onPointerdown(event);
  moveHandlers.onPointerdown(event);
};

/* -------------------------------------------------------------------------------------------------
 * Pressing the track
 * -----------------------------------------------------------------------------------------------*/

/** A press beside the thumb pages towards it. The thumb itself stops its press from reaching here. */
const onTrackPointerdown = (event: PointerEvent) => {
  if (event.button !== 0) return;

  // Not a focus change: the box is the scroller, and focus stays wherever it was in the grid.
  event.preventDefault();

  const track = event.currentTarget as HTMLElement;
  const bounds = track.getBoundingClientRect();
  // Read off the element rather than the locale: it is the box's own direction that decides which
  // end of the track the content starts at, and which way its offset runs.
  const isReversed = !isVertical && getComputedStyle(track).direction === "rtl";

  let pressed: number;

  if (isVertical) pressed = event.clientY - bounds.top;
  else if (isReversed) pressed = bounds.right - event.clientX;
  else pressed = event.clientX - bounds.left;

  // Whole pixels, so a page forward and a page back land where they started rather than half a
  // pixel off, which the browser would round away from.
  const page = Math.round(viewport.value * PAGE_FRACTION) * (pressed > thumbOffset.value ? 1 : -1);

  scrollTo(offset.value + (isReversed ? -page : page));
};

const trackStyle = computed(() =>
  isVertical
    ? { height: `${trackLength.value}px`, width: `${THICKNESS}px` }
    : {
        height: `${THICKNESS}px`,
        top: `${across(scroll.size.value) - THICKNESS}px`,
        width: `${trackLength.value}px`,
      },
);

// Measured from the inline start, which is where the content starts whichever way it runs.
const thumbStyle = computed(() =>
  isVertical
    ? { height: `${thumbLength.value}px`, top: `${thumbOffset.value}px` }
    : { "inset-inline-start": `${thumbOffset.value}px`, width: `${thumbLength.value}px` },
);
</script>

<template>
  <div
    v-if="isVisible"
    :class="slots.scrollbar()"
    :data-orientation="orientation"
    data-slot="table-scrollbar"
    :style="trackStyle"
    @pointerdown="onTrackPointerdown"
  >
    <div
      :class="slots.scrollbarThumb()"
      :data-hovered="dataAttr(states.isHovered.value)"
      :data-orientation="orientation"
      :data-pressed="dataAttr(states.isPressed.value)"
      data-slot="table-scrollbar-thumb"
      :style="thumbStyle"
      @pointerdown="onThumbPointerdown"
      @pointerenter="states.onPointerenter"
      @pointerleave="states.onPointerleave"
    />
  </div>
</template>
