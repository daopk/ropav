<script setup lang="ts" vapor>
import type { DragItem, DragPreviewRenderer } from "@/utils/dnd-types";

import { shallowRef, useTemplateRef } from "vue";

import { DragPreview } from "@/components/dnd";
import { useDrag } from "@/composables/use-drag";

/**
 * A draggable element with a custom preview, for exercising the synchronous render path.
 *
 * The preview is what a `dragstart` handler must be able to produce and hand to `setDragImage`
 * without yielding, so the fixture keeps the wiring as close to a real caller as possible.
 */
withDefaults(
  defineProps<{
    items?: DragItem[];
    withPreview?: boolean;
  }>(),
  { items: () => [{ "text/plain": "dragged" }], withPreview: true },
);

const preview = useTemplateRef<{ render: DragPreviewRenderer }>("preview");
const previewRenderer = shallowRef<DragPreviewRenderer | null>(null);

const { attrs, handlers, isDragging } = useDrag({
  getItems: () => [{ "text/plain": "dragged" }],
  preview: previewRenderer,
});

// The exposed render function only exists once the preview has mounted.
const bindPreview = () => {
  previewRenderer.value = preview.value?.render ?? null;
};
</script>

<template>
  <div>
    <div
      v-bind="attrs"
      :data-dragging="isDragging || undefined"
      data-testid="draggable"
      @click="handlers.onClick?.($event)"
      @drag="handlers.onDrag($event)"
      @dragend="handlers.onDragend($event)"
      @dragstart="
        bindPreview();
        handlers.onDragstart($event);
      "
      @keydown.capture="handlers.onKeydownCapture?.($event)"
      @keyup.capture="handlers.onKeyupCapture?.($event)"
      @pointerdown="handlers.onPointerdown?.($event)"
    >
      Drag me
    </div>

    <DragPreview v-if="withPreview" ref="preview">
      <template #default="{ items: previewItems }">
        <span data-testid="preview-content">{{ previewItems.length }} item(s)</span>
      </template>
    </DragPreview>
  </div>
</template>
