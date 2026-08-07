import type {CollectionKey, UseCollectionReturn} from "@/composables/use-collection";
import type {
  UseSelectionManagerProps,
  UseSelectionManagerReturn,
} from "@/composables/use-selection-manager";

import {afterEach, describe, expect, it, vi} from "vitest";
import {effectScope, shallowRef} from "vue";

import {useCollection} from "@/composables/use-collection";
import {useSelectionManager} from "@/composables/use-selection-manager";

const scopes: (() => void)[] = [];
const containers: HTMLElement[] = [];

/** A collection of real elements in document order, so ordering questions have real answers. */
const createCollection = (keys: CollectionKey[], disabled: CollectionKey[] = []) => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  const collection = scope.run(() => useCollection()) as UseCollectionReturn;
  const container = document.createElement("div");

  containers.push(container);
  document.body.appendChild(container);

  for (const key of keys) {
    const element = document.createElement("div");

    container.appendChild(element);
    collection.register(key, {
      element: () => element,
      isDisabled: () => disabled.includes(key),
      textValue: () => String(key),
    });
  }

  return collection;
};

const createManager = (
  props: Omit<UseSelectionManagerProps, "collection"> & {collection?: UseCollectionReturn} = {},
): UseSelectionManagerReturn => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  const collection = props.collection ?? createCollection(["a", "b", "c", "d"]);

  return scope.run(() => useSelectionManager({...props, collection})) as UseSelectionManagerReturn;
};

afterEach(() => {
  scopes.splice(0).forEach((stop) => stop());
  containers.splice(0).forEach((container) => container.remove());
});

describe("useSelectionManager", () => {
  describe("defaults", () => {
    it("selects nothing and allows nothing until a mode is given", () => {
      // React Stately defaults to "none", so a collection is inert until it opts in.
      const manager = createManager();

      expect(manager.selectionMode.value).toBe("none");
      expect(manager.selectionBehavior.value).toBe("toggle");
      expect(manager.disabledBehavior.value).toBe("all");
      expect(manager.isEmpty.value).toBe(true);
      expect(manager.canSelectItem("a")).toBe(false);
    });

    it("ignores every selection call in none mode", () => {
      const onSelectionChange = vi.fn();
      const manager = createManager({onSelectionChange});

      manager.toggleSelection("a");
      manager.replaceSelection("a");
      manager.extendSelection("a");
      manager.setSelectedKeys(["a"]);
      manager.select("a");

      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(manager.isEmpty.value).toBe(true);
    });
  });

  describe("single selection", () => {
    it("replaces the selection", () => {
      const manager = createManager({selectionMode: "single"});

      manager.select("a");
      manager.select("b");

      expect([...manager.selectedKeys.value]).toEqual(["b"]);
    });

    it("turns the selected key off again", () => {
      const manager = createManager({selectionMode: "single"});

      manager.select("a");
      manager.select("a");

      expect(manager.isEmpty.value).toBe(true);
    });

    it("keeps the last key when emptiness is disallowed", () => {
      // This is what makes single selection behave like a radio group.
      const manager = createManager({
        disallowEmptySelection: true,
        selectionMode: "single",
      });

      manager.select("a");
      manager.select("a");

      expect([...manager.selectedKeys.value]).toEqual(["a"]);
    });

    it("takes only the first key offered to setSelectedKeys", () => {
      const manager = createManager({selectionMode: "single"});

      manager.setSelectedKeys(["b", "c"]);

      expect([...manager.selectedKeys.value]).toEqual(["b"]);
    });
  });

  describe("multiple selection", () => {
    it("adds and removes keys under toggle behaviour", () => {
      const manager = createManager({selectionMode: "multiple"});

      manager.select("a");
      manager.select("b");

      expect([...manager.selectedKeys.value]).toEqual(["a", "b"]);

      manager.select("a");

      expect([...manager.selectedKeys.value]).toEqual(["b"]);
    });

    it("replaces instead of adding under replace behaviour", () => {
      const manager = createManager({
        selectionBehavior: "replace",
        selectionMode: "multiple",
      });

      manager.select("a");
      manager.select("b");

      expect([...manager.selectedKeys.value]).toEqual(["b"]);
    });

    it("adds under replace behaviour when a modifier is held", () => {
      // Without modifier support, replace behaviour would make multi-select impossible.
      const manager = createManager({
        selectionBehavior: "replace",
        selectionMode: "multiple",
      });

      manager.select("a");
      manager.select("b", {isCtrlPressed: true});

      expect([...manager.selectedKeys.value]).toEqual(["a", "b"]);
    });

    it("refuses to empty the selection when emptiness is disallowed", () => {
      const manager = createManager({
        disallowEmptySelection: true,
        selectionMode: "multiple",
      });

      manager.select("a");
      manager.select("a");

      expect([...manager.selectedKeys.value]).toEqual(["a"]);
    });
  });

  describe("range extension", () => {
    it("selects the span between the anchor and the key", () => {
      const manager = createManager({selectionMode: "multiple"});

      manager.select("b");
      manager.select("d", {isShiftPressed: true});

      expect([...manager.selectedKeys.value].sort()).toEqual(["b", "c", "d"]);
    });

    it("extends backwards from the anchor", () => {
      const manager = createManager({selectionMode: "multiple"});

      manager.select("c");
      manager.select("a", {isShiftPressed: true});

      expect([...manager.selectedKeys.value].sort()).toEqual(["a", "b", "c"]);
    });

    it("shrinks the span when the range is pulled back", () => {
      // Without dropping the previous span first, shrinking would leave keys selected.
      const manager = createManager({selectionMode: "multiple"});

      manager.select("a");
      manager.select("d", {isShiftPressed: true});
      manager.select("b", {isShiftPressed: true});

      expect([...manager.selectedKeys.value].sort()).toEqual(["a", "b"]);
    });

    it("skips a key it cannot select", () => {
      const manager = createManager({
        collection: createCollection(["a", "b", "c"], ["b"]),
        selectionMode: "multiple",
      });

      manager.select("a");
      manager.select("c", {isShiftPressed: true});

      expect([...manager.selectedKeys.value].sort()).toEqual(["a", "c"]);
    });

    it("collapses to the pressed key when coming from a select-all", () => {
      const manager = createManager({selectionMode: "multiple"});

      manager.selectAll();
      manager.extendSelection("b");

      expect([...manager.selectedKeys.value]).toEqual(["b"]);
    });

    it("replaces rather than extends in single mode", () => {
      const manager = createManager({selectionMode: "single"});

      manager.select("a");
      manager.extendSelection("c");

      expect([...manager.selectedKeys.value]).toEqual(["c"]);
    });
  });

  describe("select all", () => {
    it("reports all verbatim so a change handler sees what React reports", () => {
      const onSelectionChange = vi.fn();
      const manager = createManager({onSelectionChange, selectionMode: "multiple"});

      manager.selectAll();

      expect(onSelectionChange).toHaveBeenLastCalledWith("all");
      expect(manager.rawSelection.value).toBe("all");
    });

    it("resolves all against the collection when read as keys", () => {
      const manager = createManager({selectionMode: "multiple"});

      manager.selectAll();

      expect([...manager.selectedKeys.value].sort()).toEqual(["a", "b", "c", "d"]);
      expect(manager.isSelectAll.value).toBe(true);
    });

    it("leaves out keys it cannot select", () => {
      const manager = createManager({
        collection: createCollection(["a", "b", "c"], ["b"]),
        selectionMode: "multiple",
      });

      manager.selectAll();

      expect([...manager.selectedKeys.value].sort()).toEqual(["a", "c"]);
    });

    it("is refused in single mode", () => {
      const manager = createManager({selectionMode: "single"});

      manager.selectAll();

      expect(manager.isEmpty.value).toBe(true);
    });

    it("recognises an explicit full selection as select-all", () => {
      const manager = createManager({selectionMode: "multiple"});

      manager.setSelectedKeys(["a", "b", "c", "d"]);

      expect(manager.isSelectAll.value).toBe(true);
      expect(manager.rawSelection.value).not.toBe("all");
    });
  });

  describe("clearing", () => {
    it("empties the selection", () => {
      const manager = createManager({selectionMode: "multiple"});

      manager.setSelectedKeys(["a", "b"]);
      manager.clearSelection();

      expect(manager.isEmpty.value).toBe(true);
    });

    it("is refused when emptiness is disallowed", () => {
      const manager = createManager({
        disallowEmptySelection: true,
        selectionMode: "multiple",
      });

      manager.setSelectedKeys(["a"]);
      manager.clearSelection();

      expect([...manager.selectedKeys.value]).toEqual(["a"]);
    });
  });

  describe("disabled items", () => {
    it("blocks selection of a key listed as disabled", () => {
      const manager = createManager({disabledKeys: ["b"], selectionMode: "multiple"});

      manager.select("b");

      expect(manager.isEmpty.value).toBe(true);
      expect(manager.canSelectItem("b")).toBe(false);
      expect(manager.isDisabled("b")).toBe(true);
    });

    it("blocks selection of an item that disables itself", () => {
      const manager = createManager({
        collection: createCollection(["a", "b"], ["b"]),
        selectionMode: "multiple",
      });

      expect(manager.canSelectItem("b")).toBe(false);
    });

    it("lets a selection-only disabled item stay reachable", () => {
      // `disabledBehavior: "selection"` describes an item a user can still focus and act on
      // but cannot select, so the two predicates have to disagree here.
      const manager = createManager({
        disabledBehavior: "selection",
        disabledKeys: ["b"],
        selectionMode: "multiple",
      });

      expect(manager.isDisabled("b")).toBe(false);
      expect(manager.canSelectItem("b")).toBe(false);
    });

    it("cannot select a key the collection does not hold", () => {
      const manager = createManager({selectionMode: "multiple"});

      expect(manager.canSelectItem("nope")).toBe(false);
    });
  });

  describe("selection order", () => {
    it("reports the first and last selected keys in document order", () => {
      const manager = createManager({selectionMode: "multiple"});

      manager.setSelectedKeys(["c", "a"]);

      expect(manager.firstSelectedKey.value).toBe("a");
      expect(manager.lastSelectedKey.value).toBe("c");
    });

    it("reports null when nothing is selected", () => {
      const manager = createManager({selectionMode: "multiple"});

      expect(manager.firstSelectedKey.value).toBeNull();
      expect(manager.lastSelectedKey.value).toBeNull();
    });
  });

  describe("controlled selection", () => {
    it("follows the caller's keys and reports intended changes", () => {
      const selected = shallowRef<CollectionKey[]>(["a"]);
      const onSelectionChange = vi.fn();
      const manager = createManager({
        onSelectionChange,
        selectedKeys: () => selected.value,
        selectionMode: "multiple",
      });

      expect([...manager.selectedKeys.value]).toEqual(["a"]);

      manager.select("b");

      // The caller owns the value, so the manager reports rather than moves.
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect([...manager.selectedKeys.value]).toEqual(["a"]);

      selected.value = ["a", "b"];

      expect([...manager.selectedKeys.value]).toEqual(["a", "b"]);
    });

    it("starts from defaultSelectedKeys when uncontrolled", () => {
      const manager = createManager({
        defaultSelectedKeys: ["b"],
        selectionMode: "multiple",
      });

      expect([...manager.selectedKeys.value]).toEqual(["b"]);
    });

    it("accepts all as a default", () => {
      const manager = createManager({
        defaultSelectedKeys: "all",
        selectionMode: "multiple",
      });

      expect(manager.isSelectAll.value).toBe(true);
    });
  });

  describe("focused key", () => {
    it("holds a key the collection knows", () => {
      const manager = createManager({selectionMode: "single"});

      manager.setFocusedKey("b");

      expect(manager.focusedKey.value).toBe("b");
    });

    it("refuses a key the collection does not hold", () => {
      // Storing it would park focus on nothing and be puzzled over much later.
      const manager = createManager({selectionMode: "single"});

      manager.setFocusedKey("nope");

      expect(manager.focusedKey.value).toBeNull();
    });

    it("clears back to null", () => {
      const manager = createManager({selectionMode: "single"});

      manager.setFocusedKey("b");
      manager.setFocusedKey(null);

      expect(manager.focusedKey.value).toBeNull();
    });

    it("tracks whether the collection has focus", () => {
      const manager = createManager({selectionMode: "single"});

      expect(manager.isFocused.value).toBe(false);

      manager.setFocused(true);

      expect(manager.isFocused.value).toBe(true);
    });
  });
});

describe("useSelectionManager with a shared focus source", () => {
  it("reads and writes the focused key through the parent", () => {
    const collection = createCollection(["bold", "italic", "left"]);
    const parent = createManager({collection});
    const scoped = createManager({collection, focusSource: parent, selectionMode: "multiple"});

    parent.setFocused(true);
    parent.setFocusedKey("italic");

    // A menu whose sections each carry a selection still has one focus between them; two
    // managers holding it separately would leave two items looking focused at once.
    expect(scoped.isFocused.value).toBe(true);
    expect(scoped.focusedKey.value).toBe("italic");
  });

  it("writes focus back to the parent", () => {
    const collection = createCollection(["bold", "italic", "left"]);
    const parent = createManager({collection});
    const scoped = createManager({collection, focusSource: parent, selectionMode: "multiple"});

    scoped.setFocusedKey("bold");

    expect(parent.focusedKey.value).toBe("bold");
  });

  it("keeps a selection of its own", () => {
    const collection = createCollection(["bold", "italic", "left"]);
    const parent = createManager({collection, selectionMode: "single"});
    const scoped = createManager({collection, focusSource: parent, selectionMode: "multiple"});

    scoped.setSelectedKeys(["bold", "italic"]);

    expect([...scoped.selectedKeys.value]).toEqual(["bold", "italic"]);
    expect(parent.selectedKeys.value.size).toBe(0);
  });
});
