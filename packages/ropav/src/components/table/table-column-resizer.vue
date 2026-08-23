<script setup lang="ts" vapor>
import type { TableColumnResizerProps } from "./table.types";

import { computed, shallowRef, watch } from "vue";

import { useDescription } from "../../composables/use-description";
import { useId } from "../../composables/use-id";
import { useInteractionStates } from "../../composables/use-interaction-states";
import { useMove } from "../../composables/use-move";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import { visuallyHiddenStyle } from "../../utils/visually-hidden";

import {
  useTableColumnContext,
  useTableColumnLayoutContext,
  useTableContext,
} from "./table.context";

const props = defineProps<TableColumnResizerProps>();

const { slots } = useTableContext();
const { columnKey, headerId } = useTableColumnContext();
const resizable = useTableColumnLayoutContext();

const inputId = useId();
const input = shallowRef<HTMLInputElement | null>(null);

/** How far one arrow press moves the edge, matching React Aria's keyboard step. */
const KEYBOARD_STEP = 10;

const isResizing = computed(() => resizable?.layout.resizingColumn.value === columnKey.value);

const columnWidth = computed(() =>
  resizable ? Math.floor(resizable.layout.getColumnWidth(columnKey.value)) : 0,
);
const minWidth = computed(() =>
  resizable ? Math.floor(resizable.layout.getColumnMinWidth(columnKey.value)) : 0,
);
const maxWidth = computed(() =>
  resizable ? Math.floor(resizable.layout.getColumnMaxWidth(columnKey.value)) : 0,
);

/** The width being dragged, held apart from the layout so a drag accumulates its own deltas. */
let draggedWidth = 0;

const startResize = () => {
  if (!resizable || isResizing.value) return;

  resizable.onResizeStart(
    resizable.layout.updateResizedColumns(
      columnKey.value,
      resizable.layout.getColumnWidth(columnKey.value),
    ),
  );
  resizable.layout.startResize(columnKey.value);
};

const resize = (width: number) => {
  if (!resizable) return;

  resizable.onResize(resizable.layout.updateResizedColumns(columnKey.value, width));
};

const endResize = () => {
  if (!resizable || !isResizing.value) return;

  resizable.layout.endResize();
  resizable.onResizeEnd(
    resizable.layout.updateResizedColumns(
      columnKey.value,
      resizable.layout.getColumnWidth(columnKey.value),
    ),
  );
};

const { handlers: moveHandlers } = useMove({
  onMove: ({ deltaX, deltaY, pointerType }) => {
    let delta = deltaX;

    // An arrow press arrives as one unit; up and down mean the same as right and left here, so a
    // vertical arrow still moves the edge rather than doing nothing.
    if (pointerType === "keyboard") {
      if (deltaY !== 0 && deltaX === 0) delta = deltaY * -1;
      delta *= KEYBOARD_STEP;
    }

    if (delta === 0) return;

    draggedWidth += delta;
    resize(draggedWidth);
  },
  onMoveEnd: ({ pointerType }) => {
    draggedWidth = 0;
    // A keyboard resize stays open until Enter, Escape or Tab closes it, so only a pointer drag
    // ends the resize when it lets go.
    if (pointerType !== "keyboard") endResize();
  },
  onMoveStart: () => {
    // Read the width afresh every time a move opens: an arrow press is a whole move of its own,
    // start to end, so the running width has to come from the layout rather than from the last
    // one. React Aria sets it on every `onMoveStart` for the same reason.
    draggedWidth = resizable?.layout.getColumnWidth(columnKey.value) ?? 0;
    startResize();
  },
});

const states = useInteractionStates();

/**
 * Which way the edge can still move, which is what the cursor is picked from. Both ends clamped
 * is reported as `both`, matching React Aria — the resizer stays interactive either way.
 */
const resizableDirection = computed(() => {
  if (!resizable) return "both";
  if (minWidth.value >= columnWidth.value) return "left";
  if (maxWidth.value <= columnWidth.value) return "right";

  return "both";
});

// Says the resizer can be opened at all, and only while it is closed — once resizing has started
// the arrow keys are the whole story. React Aria's own en-US string.
const { describedBy } = useDescription(() =>
  isResizing.value ? undefined : "Press Enter to start resizing",
);

const onKeydown = (event: KeyboardEvent) => {
  if (!resizable) return;

  if (event.key === "Enter") {
    event.preventDefault();
    if (isResizing.value) endResize();
    else startResize();

    return;
  }

  if (!isResizing.value) return;

  if (event.key === "Escape" || event.key === " " || event.key === "Tab") {
    // Tab is left to the browser so focus still leaves; the resize simply closes on the way out.
    if (event.key !== "Tab") event.preventDefault();
    endResize();

    return;
  }

  moveHandlers.onKeydown(event);
};

const onPointerdown = (event: PointerEvent) => {
  states.onPointerdown(event);
  moveHandlers.onPointerdown(event);
};

// The range input is what a screen reader reads and what arrow keys land on, so it takes focus
// for the whole resize rather than the handle around it.
watch(isResizing, (resizing) => {
  if (resizing) input.value?.focus();
});

/**
 * A change event means the value was set by assistive technology rather than by a drag, and the
 * only thing that can be read out of it is the direction — so it steps by the same amount an
 * arrow press does.
 */
const onChange = (event: Event) => {
  const next = parseFloat((event.target as HTMLInputElement).value);

  resize(
    next > columnWidth.value
      ? columnWidth.value + KEYBOARD_STEP
      : columnWidth.value - KEYBOARD_STEP,
  );
};
</script>

<template>
  <div
    :class="composeSlotClassName(slots.columnResizer, props.class)"
    :data-focus-visible="dataAttr(states.isFocusVisible.value)"
    :data-focused="dataAttr(states.isFocused.value)"
    :data-hovered="dataAttr(states.isHovered.value)"
    :data-resizable-direction="resizableDirection"
    :data-resizing="dataAttr(isResizing)"
    data-slot="table-column-resizer"
    role="presentation"
    :style="{ touchAction: 'none' }"
    @keydown="onKeydown"
    @pointerdown="onPointerdown"
    @pointerenter="states.onPointerenter"
    @pointerleave="states.onPointerleave"
  >
    <input
      :id="inputId"
      ref="input"
      :aria-describedby="describedBy"
      :aria-label="props.ariaLabel ?? 'Resize column'"
      :aria-labelledby="`${inputId} ${headerId}`"
      aria-orientation="horizontal"
      :aria-valuetext="`${columnWidth} pixels`"
      :max="maxWidth"
      :min="minWidth"
      :style="visuallyHiddenStyle"
      type="range"
      :value="columnWidth"
      @blur="
        states.onBlur();
        endResize();
      "
      @change="onChange"
      @focus="states.onFocus"
    />
  </div>
</template>
