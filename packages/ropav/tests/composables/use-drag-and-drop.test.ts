import type { DragAndDropHooks, DragAndDropOptions } from "@/composables/use-drag-and-drop";

import { describe, expect, it } from "vitest";

import { useDragAndDrop } from "@/composables/use-drag-and-drop";

/** The keys the draggable half installs. */
const DRAG_KEYS = [
  "useDraggableCollectionState",
  "useDraggableCollection",
  "useDraggableItem",
  "isVirtualDragging",
] as const;

/** The keys the droppable half installs. */
const DROP_KEYS = [
  "useDroppableCollectionState",
  "useDroppableCollection",
  "useDroppableItem",
  "useDropIndicator",
  "ListDropTargetDelegate",
] as const;

const present = (hooks: DragAndDropHooks, keys: readonly string[]) =>
  keys.filter((key) => hooks[key as keyof DragAndDropHooks] !== undefined);

const hooksFor = (options: DragAndDropOptions) => useDragAndDrop(options).dragAndDropHooks;

/** Each drop handler on its own should be enough to switch the droppable half on. */
const DROP_HANDLERS = [
  "onDrop",
  "onInsert",
  "onItemDrop",
  "onMove",
  "onReorder",
  "onRootDrop",
] as const;

describe("useDragAndDrop", () => {
  describe("which halves it switches on", () => {
    /*
     * Inferred from the handlers given rather than from a flag: a collection is draggable when it
     * can say what its items are, and droppable when there is something it could do with what
     * arrives. So there is no flag to get out of step with the handlers.
     */
    it("installs the draggable half for a collection that can say what its items are", () => {
      const hooks = hooksFor({ getItems: () => [] });

      expect(present(hooks, DRAG_KEYS)).toEqual([...DRAG_KEYS]);
      expect(present(hooks, DROP_KEYS)).toEqual([]);
    });

    it("installs the droppable half for a collection that can act on a drop", () => {
      const hooks = hooksFor({ onDrop: () => {} });

      expect(present(hooks, DROP_KEYS)).toEqual([...DROP_KEYS]);
      expect(present(hooks, DRAG_KEYS)).toEqual([]);
    });

    it("installs both when the collection does both", () => {
      const hooks = hooksFor({ getItems: () => [], onReorder: () => {} });

      expect(present(hooks, DRAG_KEYS)).toEqual([...DRAG_KEYS]);
      expect(present(hooks, DROP_KEYS)).toEqual([...DROP_KEYS]);
    });

    /*
     * The reason the hooks travel as a bag rather than being imported by the collection: a list
     * box with no drag and drop never mentions these modules, so none of them reaches the bundle.
     */
    it("installs neither when the collection declares nothing", () => {
      const hooks = hooksFor({});

      expect(present(hooks, DRAG_KEYS)).toEqual([]);
      expect(present(hooks, DROP_KEYS)).toEqual([]);
      expect(Object.keys(hooks)).toEqual(["options"]);
    });

    it.each(DROP_HANDLERS)("treats %s as enough on its own", (handler) => {
      const hooks = hooksFor({ [handler]: () => {} });

      expect(present(hooks, DROP_KEYS)).toEqual([...DROP_KEYS]);
    });

    it("stays a no-op for a caller that passes only a disabled flag", () => {
      const hooks = hooksFor({ isDisabled: true });

      expect(Object.keys(hooks)).toEqual(["options"]);
    });
  });

  describe("what it passes through", () => {
    it("carries the options verbatim", () => {
      const options: DragAndDropOptions = { acceptedDragTypes: "all", getItems: () => [] };
      const hooks = hooksFor(options);

      expect(hooks.options).toBe(options);
    });

    it("carries the drag preview only with the draggable half", () => {
      const renderDragPreview = () => null;

      expect(hooksFor({ getItems: () => [], renderDragPreview }).renderDragPreview).toBe(
        renderDragPreview,
      );

      // Nothing renders a preview for a collection that cannot be dragged from.
      expect(hooksFor({ onDrop: () => {}, renderDragPreview }).renderDragPreview).toBe(undefined);
    });

    it("carries a custom drop target delegate only with the droppable half", () => {
      const dropTargetDelegate = { getDropTargetFromPoint: () => null };

      expect(hooksFor({ dropTargetDelegate, onDrop: () => {} }).dropTargetDelegate).toBe(
        dropTargetDelegate,
      );
      expect(hooksFor({ dropTargetDelegate, getItems: () => [] }).dropTargetDelegate).toBe(
        undefined,
      );
    });

    it("supplies the default delegate the collection falls back to", () => {
      const hooks = hooksFor({ onDrop: () => {} });

      expect(hooks.ListDropTargetDelegate).toBeTypeOf("function");
      expect(hooks.dropTargetDelegate).toBe(undefined);
    });
  });
});
