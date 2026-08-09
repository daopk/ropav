<script setup lang="ts" vapor>
import type {DragItem, DragPreviewRenderer} from "@/utils/dnd-types";

import {onScopeDispose, shallowRef, useTemplateRef} from "vue";

/**
 * The image that follows the pointer during a native drag.
 *
 * Ported from React Aria's `DragPreview`, and the one place the port could not follow the
 * original's mechanism. React renders the preview inside the `dragstart` handler with
 * `flushSync`, because `setDragImage` only has effect while that handler is still on the stack.
 * Vue 3.6 exposes no `flushSync`, and Vapor's scheduler is asynchronous.
 *
 * What works instead: the container is **always mounted**, and the slot is called directly at
 * drag time. A Vapor slot function returns a real Block synchronously — the roadmap's §3.1
 * correction — so `insert()` puts live DOM in the container before `setDragImage` reads it, with
 * no scheduler involved. The slot is called exactly once per drag and the block it produces is
 * the block that gets inserted, which is the condition §3.1 sets for reading a slot at all.
 *
 * Known limit: a slot supplied by a **VDOM host** through `vaporInteropPlugin` cannot be
 * rendered this way, because interop fills its nodes on `frag.insert()` rather than on call.
 * That affects Storybook stories, whose templates compile at runtime to VDOM; it does not affect
 * an ordinary SFC in an app.
 */
const slots = defineSlots<{
  /** The preview content. Receives the items being dragged. */
  default?: (props: {items: DragItem[]}) => unknown;
}>();

const container = useTemplateRef<HTMLElement>("container");
const frame = shallowRef<number>();

/**
 * Rendered offscreen rather than hidden.
 *
 * `display: none` or `visibility: hidden` would make the node unrenderable, and `setDragImage`
 * silently produces no image for one. It has to be laid out and paintable, just nowhere the user
 * can see it.
 */
const renderPreview: DragPreviewRenderer = (items, callback) => {
  const host = container.value;

  if (!host) {
    callback(null);

    return;
  }

  host.replaceChildren();

  const block = slots.default?.({items});

  if (block == null) {
    callback(null);

    return;
  }

  insertBlock(block, host);
  callback(host);

  // Leave the node in place for a frame so the browser can paint the image from it.
  if (frame.value != null) cancelAnimationFrame(frame.value);
  frame.value = requestAnimationFrame(() => {
    host.replaceChildren();
    frame.value = undefined;
  });
};

/** A Vapor Block is a node, an array of them, or a fragment carrying its own nodes. */
const insertBlock = (block: unknown, host: HTMLElement): void => {
  if (block instanceof Node) {
    host.appendChild(block);

    return;
  }

  if (Array.isArray(block)) {
    for (const child of block) insertBlock(child, host);

    return;
  }

  const nodes = (block as {nodes?: unknown}).nodes;

  if (nodes != null) insertBlock(nodes, host);
};

onScopeDispose(() => {
  if (frame.value != null) cancelAnimationFrame(frame.value);
});

defineExpose({render: renderPreview});
</script>

<template>
  <div
    ref="container"
    aria-hidden="true"
    data-slot="drag-preview"
    style="position: fixed; top: 0; left: -100000px; z-index: -100"
  />
</template>
