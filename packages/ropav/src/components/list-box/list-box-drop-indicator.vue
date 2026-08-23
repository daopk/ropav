<script setup lang="ts" vapor>
import type {ListBoxDropIndicatorProps} from "./list-box.types";

import {computed, shallowRef} from "vue";

import {dataAttr} from "../../utils/assertion";
import {VirtualizerItem} from "../virtualizer";
import {useVirtualizerStateContext} from "../virtualizer/virtualizer.context";

import {useListBoxContext} from "./list-box.context";

/**
 * The position a drop would land in, as an element a screen reader can reach.
 *
 * Rendered for every gap, not only the active one: during a keyboard drag the user Tabs between
 * these, so an indicator that only existed while active would be unreachable. `isHidden` is what
 * removes it when there is no drag at all.
 *
 * **Unstyled on purpose.** `@ropav/styles` has no rule for this, and React Aria ships its own
 * `DropIndicator` unstyled too — the class and `data-drop-target` are emitted so a rule can be
 * added later, or supplied by the caller, without touching this component.
 */
const props = defineProps<ListBoxDropIndicatorProps>();

const {dragAndDropHooks, dropState} = useListBoxContext();
const virtualizer = useVirtualizerStateContext();
const element = shallowRef<HTMLElement | null>(null);

const indicator =
  dropState && dragAndDropHooks?.useDropIndicator
    ? dragAndDropHooks.useDropIndicator({target: props.target}, dropState, element)
    : null;

const isHidden = computed(() => indicator?.isHidden.value ?? true);
const isDropTarget = computed(() => indicator?.isDropTarget.value ?? false);

/**
 * Where the gap sits, when the list is windowed.
 *
 * Every item in a virtualized list is placed absolutely, so an indicator left in ordinary flow
 * would collapse to nothing at the top of the scroll box. The layout is the only thing that knows
 * where the boundary between two items is — and for a `root` target there is no boundary, so it
 * stays in flow. `null` everywhere else, which is what leaves the wrapper out entirely.
 */
const layoutInfo = computed(() => {
  if (!virtualizer?.getDropTargetLayoutInfo || props.target.type !== "item") return null;

  return virtualizer.getDropTargetLayoutInfo(props.target);
});

/** Attributes only, never listeners — Vapor re-attaches every `on*` key spread through `v-bind`
 * on each render, so those are wired statically with `@event` instead. */
const attrs = computed(() => ({
  ...indicator?.attrs.value,
  class: ["list-box__drop-indicator", props.class],
  "data-drop-target": dataAttr(isDropTarget.value),
  "data-slot": "list-box-drop-indicator",
  role: "option",
}));
</script>

<template>
  <template v-if="!isHidden">
    <!-- Wrapped only when windowed: outside a virtualizer there is nothing to position against,
         and the extra element would sit between the listbox and its own option. -->
    <VirtualizerItem v-if="layoutInfo" :layout-info="layoutInfo">
      <div ref="element" v-bind="attrs" @click="indicator?.handlers.onClick()" />
    </VirtualizerItem>
    <div v-else ref="element" v-bind="attrs" @click="indicator?.handlers.onClick()" />
  </template>
</template>
