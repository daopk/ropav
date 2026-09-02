<script setup lang="ts" vapor>
import type { SplitterHandleProps, SplitterHandleSlotProps } from "./splitter.types";

import { computed, shallowRef, watch } from "vue";

import { useId } from "../../composables/use-id";
import { useInteractionStates } from "../../composables/use-interaction-states";
import { useMove } from "../../composables/use-move";
import { useNumberFormatter } from "../../composables/use-number-formatter";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useSplitterContext } from "./splitter.context";

const props = withDefaults(defineProps<SplitterHandleProps>(), {
  isDisabled: undefined,
  // A real default rather than the tri-state `undefined` the other booleans use: Vue casts an
  // absent boolean prop to `false`, so "not given" and "turned off" are indistinguishable here.
  resetOnDoubleClick: true,
});

defineSlots<{ default?: (props: SplitterHandleSlotProps) => unknown }>();

const {
  isDisabled: groupIsDisabled,
  keyboardLargeStep,
  keyboardStep,
  orientation,
  rootEl,
  slots,
  state,
} = useSplitterContext();

const generatedId = useId();
const handleKey = computed(() => props.id ?? generatedId.value);

const element = shallowRef<HTMLElement | null>(null);

const isDisabled = computed(() => props.isDisabled ?? groupIsDisabled.value);
const isVertical = computed(() => orientation.value === "vertical");

watch(
  [element, handleKey],
  ([current], _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      state.registerHandle(handleKey.value, {
        element: () => element.value,
        size: () =>
          (isVertical.value ? element.value?.offsetHeight : element.value?.offsetWidth) ?? 0,
      }),
    );
  },
  { flush: "post", immediate: true },
);

const states = useInteractionStates();
const isDragging = computed(() => state.resizingHandle.value === handleKey.value);

/** The delta accumulated since the drag opened; the state measures from its own snapshot. */
let total = 0;
/** Resolved once per gesture — reading it per `pointermove` would force a style recalc a frame. */
let isReversed = false;

const readDirection = () => {
  const root = rootEl.value;

  // A subtree can carry `dir="rtl"` with no locale provider above it, so the element is asked
  // rather than the locale. Only the inline axis flips; a vertical group is never mirrored.
  isReversed = !isVertical.value && !!root && getComputedStyle(root).direction === "rtl";
};

const { handlers: moveHandlers } = useMove({
  onMove: ({ deltaX, deltaY, pointerType, shiftKey }) => {
    let delta = isVertical.value ? deltaY : deltaX;

    if (pointerType === "keyboard") {
      delta *= shiftKey ? keyboardLargeStep.value : keyboardStep.value;
    }
    if (isReversed) delta = -delta;
    if (delta === 0) return;

    total += delta;
    state.resize(handleKey.value, total);
  },
  onMoveEnd: () => {
    total = 0;
    state.endResize();
  },
  onMoveStart: () => {
    // Read afresh every time a move opens: an arrow press is a whole move of its own, start to
    // end, so the running total has to restart from the layout as it stands.
    total = 0;
    readDirection();
    state.startResize(handleKey.value);
  },
});

const range = computed(() => state.handleRange(handleKey.value));
const percentFormatter = useNumberFormatter(() => ({ style: "percent" }));

const share = (pixels: number) => {
  const available = state.availableSize.value;

  return available > 0 ? Math.round((pixels / available) * 100) : 0;
};

const valueNow = computed(() => (range.value ? share(range.value.now) : 0));
const valueMin = computed(() =>
  range.value ? Math.min(share(range.value.min), valueNow.value) : 0,
);
const valueMax = computed(() =>
  range.value ? Math.max(share(range.value.max), valueNow.value) : 100,
);
const valueText = computed(() => percentFormatter.value.format(valueNow.value / 100));

const beforeId = computed(() => {
  const pair = state.neighbours(handleKey.value);

  if (!pair) return undefined;

  return state.getPanel(state.panelKeys.value[pair.before]!)?.id();
});

/**
 * `useMove` consumes every arrow key it knows before the consumer sees one, so the cross-axis
 * arrows have to be kept away from it — otherwise a vertical splitter would swallow Left and Right
 * and break horizontal scrolling inside its panels.
 */
const isAxisKey = (key: string) =>
  isVertical.value
    ? key === "ArrowUp" || key === "ArrowDown" || key === "Up" || key === "Down"
    : key === "ArrowLeft" || key === "ArrowRight" || key === "Left" || key === "Right";

/** The panel `Enter` acts on: the one before the handle when it can shut, else the one after. */
const collapsibleNeighbour = () => {
  const pair = state.neighbours(handleKey.value);

  if (!pair) return null;

  const keys = state.panelKeys.value;

  for (const index of [pair.before, pair.after]) {
    const key = keys[index];

    if (key != null && state.getPanel(key)?.isCollapsible()) return key;
  }

  return null;
};

const jump = (delta: number) => {
  state.startResize(handleKey.value);
  state.resize(handleKey.value, delta);
  state.endResize();
};

const onKeydown = (event: KeyboardEvent) => {
  if (isDisabled.value) return;

  if (event.key === "Enter") {
    const target = collapsibleNeighbour();

    if (target == null) return;

    event.preventDefault();
    state.toggleCollapse(target);

    return;
  }

  if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    jump(event.key === "Home" ? -Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER);

    return;
  }

  if (event.key === "Escape" && isDragging.value) {
    event.preventDefault();
    state.cancelResize();

    return;
  }

  if (!isAxisKey(event.key)) return;

  readDirection();
  moveHandlers.onKeydown(event);
};

/**
 * Reset rather than arithmetic: dropping the stored sizes lets the panels' declared defaults take
 * over, and the solver refills the container by construction. A collapsed neighbour is reopened on
 * the way, which is why this and `Enter` are separate gestures — one returns a panel to where the
 * user left it, the other to where the author put it.
 */
const onDblclick = () => {
  if (isDisabled.value || !props.resetOnDoubleClick) return;

  const pair = state.neighbours(handleKey.value);

  if (!pair) return;

  const keys = state.panelKeys.value;

  state.reset([keys[pair.before]!, keys[pair.after]!]);
};

const onPointerdown = (event: PointerEvent) => {
  if (isDisabled.value) return;

  states.onPointerdown(event);
  moveHandlers.onPointerdown(event);
};
</script>

<template>
  <!--
    `aria-orientation` is the inverse of `data-orientation`, and deliberately so: it describes the
    separator's own line, and a horizontally-arranged group is divided by a vertical one.
    `data-orientation` carries the group's axis, because that is what the stylesheet keys on.
  -->
  <div
    :id="generatedId"
    ref="element"
    :aria-controls="beforeId"
    :aria-disabled="isDisabled || undefined"
    :aria-label="props.ariaLabel ?? 'Resize panel'"
    :aria-labelledby="props.ariaLabelledby"
    :aria-orientation="isVertical ? 'horizontal' : 'vertical'"
    :aria-valuemax="valueMax"
    :aria-valuemin="valueMin"
    :aria-valuenow="valueNow"
    :aria-valuetext="valueText"
    :class="composeSlotClassName(slots.handle, props.class)"
    :data-disabled="dataAttr(isDisabled)"
    :data-dragging="dataAttr(isDragging)"
    :data-focus-visible="dataAttr(states.isFocusVisible.value)"
    :data-focused="dataAttr(states.isFocused.value)"
    :data-hovered="dataAttr(states.isHovered.value)"
    :data-orientation="orientation"
    data-slot="splitter-handle"
    role="separator"
    :tabindex="isDisabled ? -1 : 0"
    @blur="states.onBlur"
    @dblclick="onDblclick"
    @focus="states.onFocus"
    @keydown="onKeydown"
    @pointerdown="onPointerdown"
    @pointerenter="states.onPointerenter"
    @pointerleave="states.onPointerleave"
  >
    <span
      aria-hidden="true"
      :class="composeSlotClassName(slots.handleGrip)"
      data-slot="splitter-handle-grip"
    />
    <slot
      :is-disabled="isDisabled"
      :is-dragging="isDragging"
      :is-focus-visible="states.isFocusVisible.value"
      :is-focused="states.isFocused.value"
      :is-hovered="states.isHovered.value"
      :orientation="orientation"
    />
  </div>
</template>
