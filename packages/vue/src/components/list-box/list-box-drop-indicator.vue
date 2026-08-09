<script setup lang="ts" vapor>
import type {ListBoxDropIndicatorProps} from "./list-box.types";

import {computed, shallowRef} from "vue";

import {dataAttr} from "../../utils/assertion";

import {useListBoxContext} from "./list-box.context";

/**
 * The position a drop would land in, as an element a screen reader can reach.
 *
 * Rendered for every gap, not only the active one: during a keyboard drag the user Tabs between
 * these, so an indicator that only existed while active would be unreachable. `isHidden` is what
 * removes it when there is no drag at all.
 *
 * **Unstyled on purpose.** `@heroui/styles` has no rule for this, and React Aria ships its own
 * `DropIndicator` unstyled too — the class and `data-drop-target` are emitted so a rule can be
 * added later, or supplied by the caller, without touching this component.
 */
const props = defineProps<ListBoxDropIndicatorProps>();

const {dragAndDropHooks, dropState} = useListBoxContext();
const element = shallowRef<HTMLElement | null>(null);

const indicator =
  dropState && dragAndDropHooks?.useDropIndicator
    ? dragAndDropHooks.useDropIndicator({target: props.target}, dropState, element)
    : null;

const isHidden = computed(() => indicator?.isHidden.value ?? true);
const isDropTarget = computed(() => indicator?.isDropTarget.value ?? false);
</script>

<template>
  <div
    v-if="!isHidden"
    ref="element"
    v-bind="indicator?.attrs.value"
    class="list-box__drop-indicator"
    :class="props.class"
    :data-drop-target="dataAttr(isDropTarget)"
    data-slot="list-box-drop-indicator"
    role="option"
    @click="indicator?.handlers.onClick()"
  />
</template>
