<script setup lang="ts" vapor>
import type { TableDropIndicatorProps } from "./table.types";

import { computed, shallowRef } from "vue";

import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import { visuallyHiddenStyle } from "../../utils/visually-hidden";
import { useVirtualizerStateContext } from "../virtualizer/virtualizer.context";

import TableVirtualizerItem from "./table-virtualizer-item.vue";
import { useTableContext, useTableGridContext, useTableVirtualizerContext } from "./table.context";

/**
 * The position a drop would land in, as a row a screen reader can reach.
 *
 * Rendered for every gap, not only the active one: during a keyboard drag the user steps between
 * these, so an indicator that only existed while active would be unreachable. `isHidden` is what
 * removes it when there is no drag at all.
 *
 * The row is a real `tr` spanning every column, with the reachable part a hidden button inside
 * it — a grid will not let a row be a control, and a zero-height row with one full-width cell is
 * how React Aria fits an indicator into a table without disturbing the column layout.
 *
 * **Unstyled on purpose.** `@ropav/styles` names the class but writes no rule for it, and React
 * Aria ships its own `DropIndicator` unstyled too — the class and `data-drop-target` are emitted so
 * a rule can be added later, or supplied by the caller, without touching this component.
 */
const props = defineProps<TableDropIndicatorProps>();

const { slots } = useTableContext();
const { columnCount, dragAndDropHooks, dropState } = useTableGridContext();
const virtualizer = useTableVirtualizerContext();
const virtualizerState = useVirtualizerStateContext();

const element = shallowRef<HTMLElement | null>(null);

// Read on every use: the body keys its indicators by slot, so this one follows the gap it stands
// in as the window moves.
const indicator =
  dropState && dragAndDropHooks?.useDropIndicator
    ? dragAndDropHooks.useDropIndicator(
        {
          get target() {
            return props.target;
          },
        },
        dropState,
        element,
      )
    : null;

const isHidden = computed(() => indicator?.isHidden.value ?? true);
const isDropTarget = computed(() => indicator?.isDropTarget.value ?? false);

/** Depth of the gap, so an indented indicator lines up with the rows it sits between. */
const level = computed(() => {
  if (props.target.type !== "item") return 1;

  return (dropState?.collection.getItem(props.target.key)?.level ?? 0) + 1;
});

/**
 * Where the gap sits, when the table is windowed.
 *
 * Every row of a virtualized table is placed absolutely, so an indicator left in ordinary flow
 * would collapse to nothing at the top of the scroll box. The layout is the only thing that knows
 * where the boundary between two rows is — and for a `root` target there is no boundary, so it
 * stays where the rows themselves would put it.
 */
const layoutInfo = computed(() => {
  if (!virtualizerState?.getDropTargetLayoutInfo || props.target.type !== "item") return null;

  return virtualizerState.getDropTargetLayoutInfo(props.target);
});

/**
 * The body's own geometry, which the offset above is measured from.
 *
 * Read here rather than passed in: every wrapper in a virtualized table is positioned against
 * its parent, and a gap between two rows belongs to the same rowgroup they do.
 */
const parentLayoutInfo = computed(() =>
  virtualizer ? virtualizer.getLayoutInfo(virtualizer.collection.value.bodyKey) : null,
);
</script>

<template>
  <TableVirtualizerItem
    v-if="!isHidden"
    :layout-info="layoutInfo"
    :parent-layout-info="parentLayoutInfo"
  >
    <component
      :is="virtualizer ? 'div' : 'tr'"
      :aria-level="level"
      :class="composeSlotClassName(slots.dropIndicator, props.class)"
      :data-drop-target="dataAttr(isDropTarget)"
      data-slot="table-drop-indicator"
      role="row"
      :style="{ '--table-row-level': level }"
    >
      <component
        :is="virtualizer ? 'div' : 'td'"
        :colspan="virtualizer ? undefined : columnCount"
        role="gridcell"
        :style="{ padding: 0 }"
      >
        <div
          ref="element"
          v-bind="indicator?.attrs.value"
          role="button"
          :style="visuallyHiddenStyle"
          @click="indicator?.handlers.onClick()"
        />
      </component>
    </component>
  </TableVirtualizerItem>
</template>
