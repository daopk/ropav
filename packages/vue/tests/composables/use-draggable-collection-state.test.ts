import {describe, expect, it, vi} from "vitest";

import {useDraggableCollectionState} from "@/composables/use-draggable-collection-state";

import {createFixtureCollection, createFixtureSelection} from "./dnd-collection-state-fixtures";

/** A flat list of three, plus a folder holding two children. */
const flat = () => createFixtureCollection([{key: "a"}, {key: "b"}, {key: "c"}]);
const tree = () =>
  createFixtureCollection([
    {key: "folder"},
    {key: "child-1", parentKey: "folder"},
    {key: "child-2", parentKey: "folder"},
    {key: "sibling"},
  ]);

describe("useDraggableCollectionState", () => {
  describe("which keys travel with a drag", () => {
    // Matches native macOS behaviour: grabbing something outside the selection does not silently
    // drag items the user cannot see.
    it("drags only the grabbed item when it is not selected", () => {
      const state = useDraggableCollectionState({
        collection: flat(),
        getItems: () => [],
        selectionManager: createFixtureSelection(["b", "c"]),
      });

      expect([...state.getKeysForDrag("a")]).toEqual(["a"]);
    });

    it("drags the whole selection when the grabbed item is part of it", () => {
      const state = useDraggableCollectionState({
        collection: flat(),
        getItems: () => [],
        selectionManager: createFixtureSelection(["a", "c"]),
      });

      expect([...state.getKeysForDrag("a")].sort()).toEqual(["a", "c"]);
    });

    /**
     * A child of an already-selected folder is dropped from the set.
     *
     * Moving the folder moves its contents already; keeping both would apply the move twice to
     * the same item.
     */
    it("drops descendants of another selected item", () => {
      const state = useDraggableCollectionState({
        collection: tree(),
        getItems: () => [],
        selectionManager: createFixtureSelection(["folder", "child-1"]),
      });

      expect([...state.getKeysForDrag("folder")]).toEqual(["folder"]);
    });

    it("keeps a child whose parent is not itself selected", () => {
      const state = useDraggableCollectionState({
        collection: tree(),
        getItems: () => [],
        selectionManager: createFixtureSelection(["child-1", "sibling"]),
      });

      expect([...state.getKeysForDrag("child-1")].sort()).toEqual(["child-1", "sibling"]);
    });

    // The walk has to climb the whole ancestry, not just check the immediate parent.
    it("drops a grandchild of a selected ancestor", () => {
      const collection = createFixtureCollection([
        {key: "root"},
        {key: "mid", parentKey: "root"},
        {key: "leaf", parentKey: "mid"},
      ]);
      const state = useDraggableCollectionState({
        collection,
        getItems: () => [],
        selectionManager: createFixtureSelection(["root", "leaf"]),
      });

      expect([...state.getKeysForDrag("root")]).toEqual(["root"]);
    });
  });

  describe("building drag items", () => {
    it("hands the caller the keys and their values", () => {
      const getItems = vi.fn(() => [{"text/plain": "x"}]);
      const state = useDraggableCollectionState({
        collection: createFixtureCollection([{key: "a", value: {id: "a", name: "Ada"}}]),
        getItems,
        selectionManager: createFixtureSelection(),
      });

      state.getItems("a");

      const [keys, values] = getItems.mock.calls[0] as unknown as [Set<string>, unknown[]];

      expect([...keys]).toEqual(["a"]);
      expect(values).toEqual([{id: "a", name: "Ada"}]);
    });

    it("skips a key the collection does not know", () => {
      const getItems = vi.fn(() => []);
      const state = useDraggableCollectionState({
        collection: flat(),
        getItems,
        selectionManager: createFixtureSelection(["a", "missing"]),
      });

      state.getItems("a");

      const [, values] = getItems.mock.calls[0] as unknown as [Set<string>, unknown[]];

      expect(values).toHaveLength(1);
    });
  });

  describe("drag lifecycle", () => {
    it("records the dragged keys and reports them as dragging", () => {
      const state = useDraggableCollectionState({
        collection: flat(),
        getItems: () => [],
        selectionManager: createFixtureSelection(["a", "b"]),
      });

      state.startDrag("a", {type: "dragstart", x: 0, y: 0});

      expect(state.draggedKey.value).toBe("a");
      expect([...state.draggingKeys.value].sort()).toEqual(["a", "b"]);
      expect(state.isDragging("b")).toBe(true);
      expect(state.isDragging("c")).toBe(false);
    });

    // Focus belongs to the drag session once it starts; leaving the collection focused would
    // paint a ring on an item the user is no longer navigating.
    it("takes focus off the collection when the drag starts", () => {
      const selectionManager = createFixtureSelection(["a"]);
      const state = useDraggableCollectionState({
        collection: flat(),
        getItems: () => [],
        selectionManager,
      });

      state.startDrag("a", {type: "dragstart", x: 0, y: 0});

      expect(selectionManager.focusedCalls).toEqual([false]);
    });

    it("reports the dragged keys to onDragStart", () => {
      const onDragStart = vi.fn();
      const state = useDraggableCollectionState({
        collection: flat(),
        getItems: () => [],
        onDragStart,
        selectionManager: createFixtureSelection(["a", "b"]),
      });

      state.startDrag("a", {type: "dragstart", x: 1, y: 2});

      expect(onDragStart.mock.calls[0]?.[0]).toMatchObject({type: "dragstart", x: 1, y: 2});
      expect([...onDragStart.mock.calls[0]![0].keys].sort()).toEqual(["a", "b"]);
    });

    it("carries the dragged keys through a move", () => {
      const onDragMove = vi.fn();
      const state = useDraggableCollectionState({
        collection: flat(),
        getItems: () => [],
        onDragMove,
        selectionManager: createFixtureSelection(["a"]),
      });

      state.startDrag("a", {type: "dragstart", x: 0, y: 0});
      state.moveDrag({type: "dragmove", x: 5, y: 5});

      expect([...onDragMove.mock.calls[0]![0].keys]).toEqual(["a"]);
    });

    it("clears the dragged keys once the drag ends", () => {
      const onDragEnd = vi.fn();
      const state = useDraggableCollectionState({
        collection: flat(),
        getItems: () => [],
        onDragEnd,
        selectionManager: createFixtureSelection(["a"]),
      });

      state.startDrag("a", {type: "dragstart", x: 0, y: 0});
      state.endDrag({
        dropOperation: "move",
        isInternal: true,
        keys: new Set(),
        type: "dragend",
        x: 0,
        y: 0,
      });

      // The handler still sees the keys; the state does not keep them afterwards.
      expect([...onDragEnd.mock.calls[0]![0].keys]).toEqual(["a"]);
      expect(state.draggingKeys.value.size).toBe(0);
      expect(state.draggedKey.value).toBeNull();
    });
  });
});
