<script setup lang="ts" vapor>
import type {
  DroppableCollectionHarnessOptions,
  DroppableCollectionHarnessReady,
} from "./dnd-harness.types";

import {onMounted, shallowRef, useTemplateRef} from "vue";

import {useDropIndicator} from "@/composables/use-drop-indicator";
import {useDroppableCollection} from "@/composables/use-droppable-collection";
import {useDroppableCollectionState} from "@/composables/use-droppable-collection-state";

/**
 * A droppable collection with one drop indicator, mounted.
 *
 * The state, the collection hook and an indicator all have to exist together: the indicator
 * reads the collection's id out of the registry that `useDroppableCollection` writes to, so
 * neither can be exercised alone.
 */
const props = defineProps<{
  options: DroppableCollectionHarnessOptions;
  onReady: (ready: DroppableCollectionHarnessReady) => void;
}>();

const element = useTemplateRef<HTMLElement>("element");
const indicatorElement = useTemplateRef<HTMLElement>("indicator");
const target = shallowRef<HTMLElement | null>(null);
const indicatorTarget = shallowRef<HTMLElement | null>(null);

const state = useDroppableCollectionState({
  collection: props.options.collection,
  selectionManager: props.options.selectionManager,
  ...props.options.state,
});

const collection = useDroppableCollection(
  {
    dropTargetDelegate: props.options.dropTargetDelegate,
    keyboardDelegate: props.options.keyboardDelegate,
    ...props.options.state,
  },
  state,
  target,
);

const indicator = useDropIndicator({target: props.options.indicatorTarget}, state, indicatorTarget);

onMounted(() => {
  target.value = element.value;
  indicatorTarget.value = indicatorElement.value;
  props.onReady({collection, indicator, element: element.value!, state});
});
</script>

<template>
  <div ref="element" v-bind="collection.attrs.value" data-collection="harness" role="listbox">
    <div ref="indicator" v-bind="indicator.attrs.value" role="option" />
  </div>
</template>
