<script setup lang="ts" vapor>
import type { SidebarRailProps, SidebarRailSlotProps } from "./sidebar.types";

import { computed, shallowRef } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { useMove } from "../../composables/use-move";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useSidebarContext } from "./sidebar.context";

const props = withDefaults(defineProps<SidebarRailProps>(), {
  isDisabled: undefined,
  isResizable: undefined,
});

defineSlots<{ default?: (props: SidebarRailSlotProps) => unknown }>();

const { panelEl, panelId, side, slots, state } = useSidebarContext();

const isResizable = computed(() => Boolean(props.isResizable));
const isDisabled = computed(() => Boolean(props.isDisabled));

const minWidth = computed(() => props.minWidth ?? 180);
const maxWidth = computed(() => props.maxWidth ?? 480);

const states = useInteractionStates({ isDisabled });
const isDragging = shallowRef(false);

/** The panel's width when the gesture opened; every delta is measured against it. */
let startWidth = 0;
/** The width to go back to if the gesture is abandoned. */
let startDeclared: string | undefined;
let total = 0;
/** Resolved once per gesture — reading it per `pointermove` would force a style recalc a frame. */
let isReversed = false;
/** Whether the pointer actually travelled, which is what separates a drag from a click. */
let hasMoved = false;

const readDirection = () => {
  const panel = panelEl.value;

  // A subtree can carry `dir="rtl"` with no locale provider above it, so the element is asked
  // rather than the locale.
  isReversed = !!panel && getComputedStyle(panel).direction === "rtl";
};

/*
 * A drag clamps and never snaps shut. The splitter snaps because a pointer has no other way to
 * collapse a panel there; here the same rail toggles on a click, so a drag that also collapsed
 * would make the narrow end of the track behave like a different control.
 */
const apply = (width: number) => {
  state.setWidth(`${Math.round(Math.min(Math.max(width, minWidth.value), maxWidth.value))}px`);
};

const openGesture = () => {
  startWidth = panelEl.value?.offsetWidth ?? 0;
  startDeclared = state.width.value;
  total = 0;
  hasMoved = false;
  isDragging.value = true;
  readDirection();
};

const { handlers: moveHandlers } = useMove({
  onMove: ({ deltaX, pointerType, shiftKey }) => {
    let delta = deltaX;

    if (pointerType === "keyboard") {
      delta *= shiftKey ? (props.keyboardLargeStep ?? 50) : (props.keyboardStep ?? 10);
    }
    if (isReversed) delta = -delta;
    // A sidebar on the trailing edge grows as its rail travels the other way.
    if (side.value === "right") delta = -delta;
    if (delta === 0) return;

    hasMoved = true;
    total += delta;
    apply(startWidth + total);
  },
  onMoveEnd: () => {
    isDragging.value = false;
    total = 0;
  },
  onMoveStart: () => {
    // Read afresh every time a move opens: an arrow press is a whole move of its own, start to
    // end, so the running total has to restart from the width as it stands.
    openGesture();
  },
});

const jump = (width: number) => {
  startWidth = panelEl.value?.offsetWidth ?? 0;
  apply(width);
};

const onKeydown = (event: KeyboardEvent) => {
  if (isDisabled.value) return;

  if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
    event.preventDefault();
    state.toggle();

    return;
  }

  if (!isResizable.value) return;

  if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    jump(event.key === "Home" ? minWidth.value : maxWidth.value);

    return;
  }

  if (event.key === "Escape" && isDragging.value) {
    event.preventDefault();
    isDragging.value = false;
    if (startDeclared === undefined) state.resetWidth();
    else state.setWidth(startDeclared);

    return;
  }

  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

  readDirection();
  moveHandlers.onKeydown(event);
};

const onPointerdown = (event: PointerEvent) => {
  if (isDisabled.value) return;

  states.onPointerdown(event);
  if (isResizable.value) moveHandlers.onPointerdown(event);
};

// A rail that resizes still toggles, but only when the pointer stayed put — a drag that happens to
// end where it started is still a drag, and collapsing the panel under it would be a surprise.
const onClick = () => {
  if (isDisabled.value || hasMoved) return;

  state.toggle();
};

const onDblclick = () => {
  if (isDisabled.value || !isResizable.value) return;

  state.resetWidth();
};

const railClass = computed(() =>
  composeSlotClassName(slots.value.rail, props.class, { isResizable: isResizable.value }),
);

/*
 * Two controls in one strip, and the role says which. Dragging makes it a window splitter, so it
 * reports where the edge sits and how far it can travel. Toggling alone makes it a button, and a
 * `separator` with no value to report would be one that says nothing about itself.
 */
const width = computed(() => panelEl.value?.offsetWidth ?? 0);
</script>

<template>
  <!-- Gone entirely on a narrow viewport: the panel is a drawer there, with nothing beside it for
    a rail to divide. -->
  <div
    v-if="!state.isMobile.value"
    :aria-controls="panelId"
    :aria-disabled="isDisabled || undefined"
    :aria-expanded="isResizable ? undefined : state.isOpen.value"
    :aria-label="props.ariaLabel ?? (isResizable ? 'Resize sidebar' : 'Toggle sidebar')"
    :aria-labelledby="props.ariaLabelledby"
    :aria-orientation="isResizable ? 'vertical' : undefined"
    :aria-valuemax="isResizable ? maxWidth : undefined"
    :aria-valuemin="isResizable ? minWidth : undefined"
    :aria-valuenow="isResizable ? width : undefined"
    :class="railClass"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    :data-disabled="dataAttr(isDisabled)"
    :data-dragging="dataAttr(isDragging)"
    :data-focus-visible="dataAttr(states.isFocusVisible.value)"
    :data-focused="dataAttr(states.isFocused.value)"
    :data-hovered="dataAttr(states.isHovered.value)"
    data-slot="sidebar-rail"
    :role="isResizable ? 'separator' : 'button'"
    :tabindex="isDisabled ? -1 : 0"
    @blur="states.onBlur"
    @click="onClick"
    @dblclick="onDblclick"
    @focus="states.onFocus"
    @keydown="onKeydown"
    @pointerdown="onPointerdown"
    @pointerenter="states.onPointerenter"
    @pointerleave="states.onPointerleave"
  >
    <span
      aria-hidden="true"
      :class="composeSlotClassName(slots.railTarget)"
      data-slot="sidebar-rail-target"
    />
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-disabled="isDisabled"
      :is-dragging="isDragging"
      :is-focus-visible="states.isFocusVisible.value"
      :is-focused="states.isFocused.value"
      :is-hovered="states.isHovered.value"
      :is-resizable="isResizable"
    />
  </div>
</template>
