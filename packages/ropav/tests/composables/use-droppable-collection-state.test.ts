import type {
  DropOperationEvent,
  UseDroppableCollectionStateOptions,
} from "@/composables/use-droppable-collection-state";
import type { DragKey, DropTarget } from "@/utils/dnd-types";

import { describe, expect, it, vi } from "vitest";

import { useDroppableCollectionState } from "@/composables/use-droppable-collection-state";

import {
  createFixtureCollection,
  createFixtureSelection,
  createFixtureTypes,
} from "./dnd-collection-state-fixtures";

const flat = () => createFixtureCollection([{ key: "a" }, { key: "b" }, { key: "c" }]);
const tree = () =>
  createFixtureCollection([
    { key: "folder" },
    { key: "child-1", parentKey: "folder" },
    { key: "child-2", parentKey: "folder" },
    { key: "other" },
  ]);

const item = (key: DragKey, dropPosition: "after" | "before" | "on"): DropTarget => ({
  dropPosition,
  key,
  type: "item",
});

const root: DropTarget = { type: "root" };

/** A candidate drop, with the parts a test is not exercising filled in. */
const operationEvent = (overrides: Partial<DropOperationEvent> = {}): DropOperationEvent => ({
  allowedOperations: ["move", "copy"],
  draggingKeys: new Set(),
  isInternal: false,
  target: item("b", "before"),
  types: createFixtureTypes(["text/plain"]),
  ...overrides,
});

/** The state under test, with a flat collection and an empty selection unless overridden. */
const state = (options: Partial<UseDroppableCollectionStateOptions> = {}) =>
  useDroppableCollectionState({
    collection: flat(),
    selectionManager: createFixtureSelection(),
    ...options,
  });

describe("useDroppableCollectionState", () => {
  describe("the current target", () => {
    it("starts with no target", () => {
      expect(state().target.value).toBeNull();
    });

    it("records the target it is set to", () => {
      const dropState = state();

      dropState.setTarget(item("b", "before"));

      expect(dropState.target.value).toEqual(item("b", "before"));
    });

    it("announces entering and leaving as the target moves", () => {
      const onDropEnter = vi.fn();
      const onDropExit = vi.fn();
      const dropState = state({ onDropEnter, onDropExit });

      dropState.setTarget(item("a", "on"));
      expect(onDropEnter).toHaveBeenCalledTimes(1);
      expect(onDropExit).not.toHaveBeenCalled();

      dropState.setTarget(item("c", "on"));
      expect(onDropExit).toHaveBeenCalledTimes(1);
      expect(onDropEnter).toHaveBeenCalledTimes(2);
    });

    it("does nothing when set to the target it already has", () => {
      const onDropEnter = vi.fn();
      const dropState = state({ onDropEnter });

      dropState.setTarget(item("a", "on"));
      dropState.setTarget(item("a", "on"));

      expect(onDropEnter).toHaveBeenCalledTimes(1);
    });
  });

  describe("recognising the same gap named two ways", () => {
    /**
     * "After a" and "before b" are one position between two adjacent items.
     *
     * The pointer path and the keyboard path do not agree on which name to use, so treating them
     * as different targets would flicker the indicator and fire a spurious enter/exit pair.
     */
    it("treats after one item and before the next as the same target", () => {
      const dropState = state();

      dropState.setTarget(item("a", "after"));

      expect(dropState.isDropTarget(item("b", "before"))).toBe(true);
    });

    it("treats them as the same in the other direction too", () => {
      const dropState = state();

      dropState.setTarget(item("b", "before"));

      expect(dropState.isDropTarget(item("a", "after"))).toBe(true);
    });

    it("does not conflate gaps that are not adjacent", () => {
      const dropState = state();

      dropState.setTarget(item("a", "after"));

      expect(dropState.isDropTarget(item("c", "before"))).toBe(false);
    });

    // Sibling links, not list adjacency: a child's next sibling is the next item under the same
    // parent, so "after the last child" is not "before the folder's sibling".
    it("follows sibling links rather than list order in a tree", () => {
      const dropState = state({ collection: tree() });

      dropState.setTarget(item("child-2", "after"));

      expect(dropState.isDropTarget(item("other", "before"))).toBe(false);
    });

    it("never conflates a drop on an item with a gap", () => {
      const dropState = state();

      dropState.setTarget(item("a", "after"));

      expect(dropState.isDropTarget(item("b", "on"))).toBe(false);
    });
  });

  describe("which drops are allowed", () => {
    it("refuses everything when no handler was supplied", () => {
      expect(state().getDropOperation(operationEvent())).toBe("cancel");
    });

    it("refuses everything while disabled", () => {
      const dropState = state({ isDisabled: true, onInsert: vi.fn() });

      expect(dropState.getDropOperation(operationEvent())).toBe("cancel");
    });

    it("accepts an insert from outside between two items", () => {
      const dropState = state({ onInsert: vi.fn() });

      expect(dropState.getDropOperation(operationEvent({ isInternal: false }))).toBe("move");
    });

    // `onInsert` is for items arriving from elsewhere; the same gesture inside the collection is
    // a reorder, and a collection that only declared `onInsert` must not accept it.
    it("refuses an internal drag when only onInsert was supplied", () => {
      const dropState = state({ onInsert: vi.fn() });

      expect(
        dropState.getDropOperation(
          operationEvent({ draggingKeys: new Set(["a"]), isInternal: true }),
        ),
      ).toBe("cancel");
    });

    it("accepts a reorder between siblings", () => {
      const dropState = state({ onReorder: vi.fn() });

      expect(
        dropState.getDropOperation(
          operationEvent({ draggingKeys: new Set(["a"]), isInternal: true }),
        ),
      ).toBe("move");
    });

    /**
     * Reordering is rearranging siblings.
     *
     * A drag spanning two parents changes an item's parent, which is a move — so `onReorder`
     * alone does not accept it.
     */
    it("refuses a reorder whose items do not share the target's parent", () => {
      const dropState = state({ collection: tree(), onReorder: vi.fn() });

      expect(
        dropState.getDropOperation(
          operationEvent({
            draggingKeys: new Set(["other"]),
            isInternal: true,
            target: item("child-1", "before"),
          }),
        ),
      ).toBe("cancel");
    });

    it("accepts that same cross-parent drag as a move", () => {
      const dropState = state({ collection: tree(), onMove: vi.fn() });

      expect(
        dropState.getDropOperation(
          operationEvent({
            draggingKeys: new Set(["other"]),
            isInternal: true,
            target: item("child-1", "before"),
          }),
        ),
      ).toBe("move");
    });

    it("accepts a drop onto an item", () => {
      const dropState = state({ onItemDrop: vi.fn() });

      expect(dropState.getDropOperation(operationEvent({ target: item("b", "on") }))).toBe("move");
    });

    it("accepts a root drop from outside", () => {
      const dropState = state({ onRootDrop: vi.fn() });

      expect(dropState.getDropOperation(operationEvent({ target: root }))).toBe("move");
    });

    // Dropping a collection's own items onto its own root reads as a no-op.
    it("refuses a root drop that came from inside", () => {
      const dropState = state({ onRootDrop: vi.fn() });

      expect(
        dropState.getDropOperation(
          operationEvent({ draggingKeys: new Set(["a"]), isInternal: true, target: root }),
        ),
      ).toBe("cancel");
    });

    // `onDrop` is the escape hatch: it replaces the specific handlers rather than joining them.
    it("accepts anything once onDrop is supplied", () => {
      const dropState = state({ onDrop: vi.fn() });

      expect(dropState.getDropOperation(operationEvent({ target: root }))).toBe("move");
    });
  });

  describe("accepted drag types", () => {
    it("refuses a drag carrying none of the accepted types", () => {
      const dropState = state({ acceptedDragTypes: ["image/png"], onInsert: vi.fn() });

      expect(dropState.getDropOperation(operationEvent())).toBe("cancel");
    });

    it("accepts a drag carrying one of them", () => {
      const dropState = state({ acceptedDragTypes: ["text/plain"], onInsert: vi.fn() });

      expect(dropState.getDropOperation(operationEvent())).toBe("move");
    });
  });

  describe("dropping onto itself", () => {
    it("refuses dropping an item onto itself", () => {
      const dropState = state({ onItemDrop: vi.fn() });

      expect(
        dropState.getDropOperation(
          operationEvent({
            draggingKeys: new Set(["b"]),
            isInternal: true,
            target: item("b", "on"),
          }),
        ),
      ).toBe("cancel");
    });

    /**
     * A folder cannot be dropped inside itself.
     *
     * Allowing it would detach the subtree and reparent it under a node travelling with the
     * drag, leaving both unreachable.
     */
    it("refuses dropping a folder into its own child", () => {
      const dropState = state({ collection: tree(), onMove: vi.fn() });

      expect(
        dropState.getDropOperation(
          operationEvent({
            draggingKeys: new Set(["folder"]),
            isInternal: true,
            target: item("child-1", "on"),
          }),
        ),
      ).toBe("cancel");
    });

    it("allows dropping onto an unrelated item", () => {
      const dropState = state({ collection: tree(), onItemDrop: vi.fn() });

      expect(
        dropState.getDropOperation(
          operationEvent({
            draggingKeys: new Set(["folder"]),
            isInternal: true,
            target: item("other", "on"),
          }),
        ),
      ).toBe("move");
    });
  });

  describe("the caller's own decision", () => {
    it("defers to getDropOperation when the drop is otherwise valid", () => {
      const dropState = state({ getDropOperation: () => "copy", onInsert: vi.fn() });

      expect(dropState.getDropOperation(operationEvent())).toBe("copy");
    });

    // The matrix runs first: a caller cannot opt into a drop the collection has no handler for.
    it("is not consulted for a drop the collection could not perform", () => {
      const getDropOperation = vi.fn(() => "copy" as const);
      const dropState = state({ getDropOperation });

      expect(dropState.getDropOperation(operationEvent())).toBe("cancel");
      expect(getDropOperation).not.toHaveBeenCalled();
    });

    it("falls back to the first allowed operation", () => {
      const dropState = state({ onInsert: vi.fn() });

      expect(
        dropState.getDropOperation(operationEvent({ allowedOperations: ["copy", "move"] })),
      ).toBe("copy");
    });
  });

  describe("shouldAcceptItemDrop", () => {
    it("refuses a drop onto an item the caller rejects", () => {
      const dropState = state({ onItemDrop: vi.fn(), shouldAcceptItemDrop: () => false });

      expect(dropState.getDropOperation(operationEvent({ target: item("b", "on") }))).toBe(
        "cancel",
      );
    });

    // It only governs "on" drops; a gap between items is not an item drop.
    it("leaves drops between items alone", () => {
      const dropState = state({ onInsert: vi.fn(), shouldAcceptItemDrop: () => false });

      expect(dropState.getDropOperation(operationEvent({ target: item("b", "before") }))).toBe(
        "move",
      );
    });
  });
});
