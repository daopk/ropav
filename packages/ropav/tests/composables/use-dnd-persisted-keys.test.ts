import type {DragAndDropHooks} from "@/composables/use-drag-and-drop";
import type {UseDroppableCollectionStateReturn} from "@/composables/use-droppable-collection-state";
import type {DragCollection, DropTarget} from "@/utils/dnd-types";
import type {ShallowRef} from "vue";

import {describe, expect, it} from "vitest";
import {shallowRef} from "vue";

import {useDndPersistedKeys} from "@/composables/use-dnd-persisted-keys";

/**
 * Which rows a windowed collection has to keep in the DOM while a drag runs.
 *
 * Only ever more than the focused one during a **virtual** drag: a pointer cannot reach a row
 * that is not on screen, so there is nothing extra to keep alive for it.
 */

const ORDER = ["a", "b", "c"];

const collection = {
  getItem: (key) => ({key, type: "item"}),
  getKeyAfter: (key) => ORDER[ORDER.indexOf(String(key)) + 1] ?? null,
  getKeyBefore: (key) => ORDER[ORDER.indexOf(String(key)) - 1] ?? null,
  getKeys: () => ORDER,
} satisfies DragCollection;

/** The state as the composable reads it, with the target left writable so a test can move it. */
type TestDropState = UseDroppableCollectionStateReturn<unknown> & {
  target: ShallowRef<DropTarget | null>;
};

const createDropState = (target: DropTarget | null): TestDropState =>
  ({
    collection,
    target: shallowRef(target),
  }) as unknown as TestDropState;

const hooks = (isVirtualDragging: boolean) =>
  ({isVirtualDragging: () => isVirtualDragging, options: {}}) as DragAndDropHooks;

describe("useDndPersistedKeys", () => {
  it("keeps the focused key, which is where the roving tab stop lives", () => {
    const keys = useDndPersistedKeys(() => "b");

    expect([...keys.value]).toEqual(["b"]);
  });

  it("keeps nothing when nothing is focused and no drag is running", () => {
    const keys = useDndPersistedKeys(() => null);

    expect([...keys.value]).toEqual([]);
  });

  // The target is reached by pressing a key, so it can be a row nobody has scrolled to.
  it("adds the drop target during a virtual drag", () => {
    const dropState = createDropState({dropPosition: "before", key: "c", type: "item"});
    const keys = useDndPersistedKeys(() => "a", hooks(true), dropState);

    expect([...keys.value].sort()).toEqual(["a", "c"]);
  });

  /**
   * "After b" is drawn by whatever follows b, so persisting b itself would keep the wrong row
   * alive and leave the indicator with nothing to attach to.
   */
  it("normalises an after target to the row that draws it", () => {
    const dropState = createDropState({dropPosition: "after", key: "b", type: "item"});
    const keys = useDndPersistedKeys(() => null, hooks(true), dropState);

    expect([...keys.value]).toEqual(["c"]);
  });

  it("falls back to the target itself at the end of the collection", () => {
    const dropState = createDropState({dropPosition: "after", key: "c", type: "item"});
    const keys = useDndPersistedKeys(() => null, hooks(true), dropState);

    expect([...keys.value]).toEqual(["c"]);
  });

  // A pointer cannot point at a row that is not rendered, so there is nothing to rescue.
  it("adds nothing for a pointer drag", () => {
    const dropState = createDropState({dropPosition: "before", key: "c", type: "item"});
    const keys = useDndPersistedKeys(() => "a", hooks(false), dropState);

    expect([...keys.value]).toEqual(["a"]);
  });

  // Dropping on the collection as a whole names no row to keep.
  it("adds nothing for a root target", () => {
    const dropState = createDropState({type: "root"});
    const keys = useDndPersistedKeys(() => "a", hooks(true), dropState);

    expect([...keys.value]).toEqual(["a"]);
  });

  it("follows the target as the drag moves", () => {
    const dropState = createDropState({dropPosition: "before", key: "b", type: "item"});
    const keys = useDndPersistedKeys(() => null, hooks(true), dropState);

    expect([...keys.value]).toEqual(["b"]);

    dropState.target.value = {dropPosition: "before", key: "c", type: "item"};

    expect([...keys.value]).toEqual(["c"]);
  });
});
