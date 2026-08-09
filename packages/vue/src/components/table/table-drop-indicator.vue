<script setup lang="ts" vapor>
import type {TableDropIndicatorProps} from "./table.types";

import {computed, shallowRef} from "vue";

import {dataAttr} from "../../utils/assertion";
import {visuallyHiddenStyle} from "../../utils/visually-hidden";

import {useTableGridContext, useTableVirtualizerContext} from "./table.context";

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
 * **Unstyled on purpose.** `@heroui/styles` has no rule for this, and React Aria ships its own
 * `DropIndicator` unstyled too — the class and `data-drop-target` are emitted so a rule can be
 * added later, or supplied by the caller, without touching this component.
 */
const props = defineProps<TableDropIndicatorProps>();

const {columnCount, dragAndDropHooks, dropState} = useTableGridContext();
const virtualizer = useTableVirtualizerContext();

const element = shallowRef<HTMLElement | null>(null);

const indicator =
  dropState && dragAndDropHooks?.useDropIndicator
    ? dragAndDropHooks.useDropIndicator({target: props.target}, dropState, element)
    : null;

const isHidden = computed(() => indicator?.isHidden.value ?? true);
const isDropTarget = computed(() => indicator?.isDropTarget.value ?? false);

/** Depth of the gap, so an indented indicator lines up with the rows it sits between. */
const level = computed(() => {
  if (props.target.type !== "item") return 1;

  return (dropState?.collection.getItem(props.target.key)?.level ?? 0) + 1;
});
</script>

<template>
  <component
    :is="virtualizer ? 'div' : 'tr'"
    v-if="!isHidden"
    :aria-level="level"
    class="table__drop-indicator"
    :class="props.class"
    :data-drop-target="dataAttr(isDropTarget)"
    data-slot="table-drop-indicator"
    role="row"
    :style="{'--table-row-level': level}"
  >
    <component
      :is="virtualizer ? 'div' : 'td'"
      :colspan="virtualizer ? undefined : columnCount"
      role="gridcell"
      :style="{padding: 0}"
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
</template>
