<script setup lang="ts" vapor>
import type { DragHarnessOptions, DragHarnessReady } from "./dnd-harness.types";

import { onMounted, useTemplateRef } from "vue";

import { useDrag } from "@/composables/use-drag";

/**
 * Mounts `useDrag` so it has a component to inject a locale from.
 *
 * The handlers are deliberately **not** wired to the element: the tests call them directly with
 * events they build, which is the only way to control `dataTransfer` and modifier state. Wiring
 * them here as well would double every invocation.
 */
const props = defineProps<{
  options: DragHarnessOptions;
  onReady: (ready: DragHarnessReady) => void;
}>();

const element = useTemplateRef<HTMLElement>("element");
const drag = useDrag({ getItems: () => [{ "text/plain": "dragged" }], ...props.options });

onMounted(() => props.onReady({ ...drag, element: element.value! }));
</script>

<template>
  <div ref="element" data-testid="draggable" tabindex="0">Drag me</div>
</template>
