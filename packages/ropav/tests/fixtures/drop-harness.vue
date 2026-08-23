<script setup lang="ts" vapor>
import type { DropHarnessOptions, DropHarnessReady } from "./dnd-harness.types";

import { onMounted, shallowRef, useTemplateRef } from "vue";

import { useDrop } from "@/composables/use-drop";

/**
 * Mounts `useDrop` so it has a component to inject a locale from.
 *
 * The element is owned here because `useDrop` takes a ref to it and registers it with the drag
 * session on mount. As with the drag harness, handlers are left unwired — the tests invoke them
 * with events they construct.
 */
const props = defineProps<{
  options: DropHarnessOptions;
  onReady: (ready: DropHarnessReady) => void;
}>();

const element = useTemplateRef<HTMLElement>("element");
const target = shallowRef<HTMLElement | null>(null);
const drop = useDrop({ ...props.options, ref: target });

onMounted(() => {
  target.value = element.value;
  props.onReady({ ...drop, element: element.value! });
});
</script>

<template>
  <div ref="element" data-testid="drop-target" tabindex="0">
    <span data-testid="child">child</span>
  </div>
</template>
