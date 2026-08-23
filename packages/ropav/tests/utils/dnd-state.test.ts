import {afterEach, describe, expect, it} from "vitest";
import {shallowRef} from "vue";

import {DROP_OPERATION} from "@/utils/dnd-constants";
import {
  clearGlobalDnDState,
  globalAllowedDropOperations,
  globalDndState,
  globalDropEffect,
  isInternalDropOperation,
  setDraggingCollectionRef,
  setDraggingKeys,
  setDropCollectionRef,
  setGlobalAllowedDropOperations,
  setGlobalDropEffect,
} from "@/utils/dnd-state";

const element = (): HTMLElement => document.createElement("div");

afterEach(() => {
  clearGlobalDnDState();
  setGlobalDropEffect(undefined);
  setGlobalAllowedDropOperations(DROP_OPERATION.none);
});

describe("global drag and drop state", () => {
  describe("lifecycle", () => {
    it("starts with no collection and no dragged keys", () => {
      expect(globalDndState.draggingCollectionRef).toBeUndefined();
      expect(globalDndState.dropCollectionRef).toBeUndefined();
      expect(globalDndState.draggingKeys.size).toBe(0);
    });

    it("records the dragging collection and the keys it gave up", () => {
      const source = shallowRef<HTMLElement | null>(element());

      setDraggingCollectionRef(source);
      setDraggingKeys(new Set(["a", "b"]));

      expect(globalDndState.draggingCollectionRef).toBe(source);
      expect([...globalDndState.draggingKeys]).toEqual(["a", "b"]);
    });

    it("clears back to an empty session", () => {
      setDraggingCollectionRef(shallowRef<HTMLElement | null>(element()));
      setDraggingKeys(new Set(["a"]));
      clearGlobalDnDState();

      expect(globalDndState.draggingCollectionRef).toBeUndefined();
      expect(globalDndState.draggingKeys.size).toBe(0);
    });
  });

  describe("isInternalDropOperation", () => {
    it("is false when nothing is being dragged", () => {
      expect(isInternalDropOperation()).toBe(false);
    });

    it("is true when the drop collection is the one the drag started in", () => {
      const shared = shallowRef<HTMLElement | null>(element());

      setDraggingCollectionRef(shared);
      setDropCollectionRef(shared);

      expect(isInternalDropOperation()).toBe(true);
    });

    it("is false when the drop lands on a different collection", () => {
      setDraggingCollectionRef(shallowRef<HTMLElement | null>(element()));
      setDropCollectionRef(shallowRef<HTMLElement | null>(element()));

      expect(isInternalDropOperation()).toBe(false);
    });

    // The first `dragenter` fires before the drop collection has registered itself, so the
    // caller passes its own ref rather than relying on the global one.
    it("accepts a ref for a drop collection that has not registered yet", () => {
      const source = shallowRef<HTMLElement | null>(element());

      setDraggingCollectionRef(source);

      expect(isInternalDropOperation(source)).toBe(true);
      expect(isInternalDropOperation(shallowRef<HTMLElement | null>(element()))).toBe(false);
    });

    // Two collections that have both unmounted would otherwise compare equal as `null === null`
    // and report a foreign drag as internal.
    it("is false when the dragging collection has unmounted", () => {
      const source = shallowRef<HTMLElement | null>(null);

      setDraggingCollectionRef(source);
      setDropCollectionRef(shallowRef<HTMLElement | null>(null));

      expect(isInternalDropOperation()).toBe(false);
    });
  });

  describe("drop effect and allowed operations", () => {
    // These live outside the state object because `dragend` fires after the drop target has
    // already torn itself down, and the source still needs the answer.
    it("survives a state clear so the source can read it on dragend", () => {
      setGlobalDropEffect("move");
      clearGlobalDnDState();

      expect(globalDropEffect).toBe("move");
    });

    it("records the operations the source advertised", () => {
      setGlobalAllowedDropOperations(DROP_OPERATION.copy | DROP_OPERATION.move);

      expect(globalAllowedDropOperations).toBe(3);
    });
  });
});
