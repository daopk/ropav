import type {
  DragCollection,
  DragCollectionNode,
  DragKey,
  DropTarget,
  DropTargetDelegate,
} from "@/utils/dnd-types";

import {describe, expect, it} from "vitest";

import {TreeDropTargetDelegate} from "@/utils/dnd-tree-drop-target-delegate";

/**
 * A fixed tree, in document order:
 *
 * ```
 * root       level 0
 *   a        level 0
 *     a1     level 1
 *     a2     level 1   ← last child of `a`
 *   b        level 0   ← last row of the whole table
 *     b1     level 1   ← last child of `b`, and the last row
 * ```
 *
 * The gap under `a2` is unambiguous — `b` follows it. The gap under `b1` is not: it is
 * simultaneously "after b1", "after b" and the end of the table, which is the whole reason this
 * delegate exists.
 */
const ROWS: DragCollectionNode[] = [
  {firstChildKey: "a1", hasChildItems: true, key: "a", lastChildKey: "a2", level: 0},
  {key: "a1", level: 1, parentKey: "a"},
  {key: "a2", level: 1, parentKey: "a"},
  {firstChildKey: "b1", hasChildItems: true, key: "b", lastChildKey: "b1", level: 0},
  {key: "b1", level: 1, parentKey: "b"},
];

const order = ROWS.map((row) => row.key);

/** Sibling links, which skip a row's whole subtree — unlike document order. */
const siblingAt = (key: DragKey, offset: number): DragKey | null => {
  const parentKey = ROWS.find((row) => row.key === key)?.parentKey ?? null;
  const siblings = ROWS.filter((row) => (row.parentKey ?? null) === parentKey).map(
    (row) => row.key,
  );

  return siblings[siblings.indexOf(key) + offset] ?? null;
};

const collection: DragCollection = {
  getItem: (key) => {
    const row = ROWS.find((candidate) => candidate.key === key);

    if (!row) return null;

    return {...row, nextKey: siblingAt(key, 1), prevKey: siblingAt(key, -1), type: "item"};
  },
  getKeyAfter: (key) => order[order.indexOf(key) + 1] ?? null,
  getKeyBefore: (key) => order[order.indexOf(key) - 1] ?? null,
  getKeys: () => order,
};

/** A stub that answers with whatever the test says the pointer is over. */
const stubDelegate = (target: DropTarget | null): DropTargetDelegate => ({
  getDropTargetFromPoint: () => target,
});

const build = (
  target: DropTarget | null,
  options: {expandedKeys?: DragKey[]; direction?: "ltr" | "rtl"} = {},
) =>
  new TreeDropTargetDelegate(stubDelegate(target), {
    collection: () => collection,
    direction: () => options.direction ?? "ltr",
    expandedKeys: () => new Set(options.expandedKeys ?? ["a", "b"]),
  });

const anything = () => true;

describe("TreeDropTargetDelegate", () => {
  describe("passing through", () => {
    // Only the meaning of a gap differs in a tree; which row the pointer is over does not.
    it("hands back the root untouched", () => {
      const delegate = build({type: "root"});

      expect(delegate.getDropTargetFromPoint(0, 0, anything)).toEqual({type: "root"});
    });

    it("hands back nothing when the wrapped delegate found nothing", () => {
      const delegate = build(null);

      expect(delegate.getDropTargetFromPoint(0, 0, anything)).toBeNull();
    });

    // A gap with a sibling after it can only mean one thing, so it survives unchanged.
    it("leaves an unambiguous gap alone", () => {
      const delegate = build({dropPosition: "after", key: "a2", type: "item"});

      expect(delegate.getDropTargetFromPoint(0, 0, anything)).toEqual({
        dropPosition: "after",
        key: "a2",
        type: "item",
      });
    });
  });

  describe("dropping under an open parent", () => {
    /**
     * The line the user sees under an open row is drawn *inside* it, above its first child —
     * not below the whole subtree, which is where "after the parent" would put it.
     */
    it("means before the first child, not after the subtree", () => {
      const delegate = build({dropPosition: "after", key: "a", type: "item"});

      expect(delegate.getDropTargetFromPoint(0, 0, anything)).toEqual({
        dropPosition: "before",
        key: "a1",
        type: "item",
      });
    });

    // Closed, its children are not in the collection at all, so there is nothing to drop above.
    it("stays after the parent while it is closed", () => {
      const delegate = build({dropPosition: "after", key: "a", type: "item"}, {expandedKeys: []});

      expect(delegate.getDropTargetFromPoint(0, 0, anything)).toEqual({
        dropPosition: "after",
        key: "a",
        type: "item",
      });
    });

    // Nowhere is left to drop, and offering the wrong place is worse than offering none.
    it("refuses when the only candidate is rejected", () => {
      const delegate = build({dropPosition: "after", key: "a", type: "item"});
      const rejectFirstChild = (target: DropTarget) =>
        !(target.type === "item" && target.key === "a1");

      expect(delegate.getDropTargetFromPoint(0, 0, rejectFirstChild)).toEqual({type: "root"});
    });
  });

  describe("the ambiguous gap at the end of a subtree", () => {
    // Arriving from above starts at the innermost level, which is where the eye is.
    it("starts innermost", () => {
      const delegate = build({dropPosition: "after", key: "b1", type: "item"});

      expect(delegate.getDropTargetFromPoint(100, 100, anything)).toEqual({
        dropPosition: "after",
        key: "b1",
        type: "item",
      });
    });

    /**
     * X is what chooses the level, because Y cannot: every candidate sits on the same line.
     * Left is outwards in a left-to-right table.
     */
    it("steps outwards as the pointer moves left", () => {
      const delegate = build({dropPosition: "after", key: "b1", type: "item"});

      delegate.getDropTargetFromPoint(100, 100, anything);

      expect(delegate.getDropTargetFromPoint(50, 100, anything)).toEqual({
        dropPosition: "after",
        key: "b",
        type: "item",
      });
    });

    it("steps back in as the pointer moves right", () => {
      const delegate = build({dropPosition: "after", key: "b1", type: "item"});

      delegate.getDropTargetFromPoint(100, 100, anything);
      delegate.getDropTargetFromPoint(50, 100, anything);

      expect(delegate.getDropTargetFromPoint(100, 100, anything)).toEqual({
        dropPosition: "after",
        key: "b1",
        type: "item",
      });
    });

    // Outwards is towards the start of the line, which flips with the writing direction.
    it("reads left as inwards in a right-to-left table", () => {
      const delegate = build({dropPosition: "after", key: "b1", type: "item"}, {direction: "rtl"});

      delegate.getDropTargetFromPoint(50, 100, anything);

      expect(delegate.getDropTargetFromPoint(100, 100, anything)).toEqual({
        dropPosition: "after",
        key: "b",
        type: "item",
      });
    });

    // A hand that is not quite still would otherwise flicker between levels every frame.
    it("ignores a nudge smaller than the threshold", () => {
      const delegate = build({dropPosition: "after", key: "b1", type: "item"});

      delegate.getDropTargetFromPoint(100, 100, anything);

      expect(delegate.getDropTargetFromPoint(95, 100, anything)).toEqual({
        dropPosition: "after",
        key: "b1",
        type: "item",
      });
    });

    // A level nothing will accept is not a level the pointer can reach.
    it("skips a level the drag would be refused at", () => {
      const delegate = build({dropPosition: "after", key: "b1", type: "item"});
      const rejectAfterB = (target: DropTarget) => !(target.type === "item" && target.key === "b");

      delegate.getDropTargetFromPoint(100, 100, rejectAfterB);

      expect(delegate.getDropTargetFromPoint(50, 100, rejectAfterB)).toEqual({
        dropPosition: "after",
        key: "b1",
        type: "item",
      });
    });
  });

  describe("normalising a gap", () => {
    /**
     * "Before b" and "after a2" are the same line. Only one of them is walked, so the
     * ambiguity is resolved once rather than in two places.
     */
    it("reads a before as an after on the row above", () => {
      const delegate = build({dropPosition: "before", key: "b", type: "item"});

      expect(delegate.getDropTargetFromPoint(0, 0, anything)).toEqual({
        dropPosition: "after",
        key: "a2",
        type: "item",
      });
    });

    // With nothing above it there is no "after" to rewrite to.
    it("leaves the very first gap as a before", () => {
      const delegate = build({dropPosition: "before", key: "a", type: "item"});

      expect(delegate.getDropTargetFromPoint(0, 0, anything)).toEqual({
        dropPosition: "before",
        key: "a",
        type: "item",
      });
    });
  });

  // Dropping onto a row names one place and one place only, whatever the tree looks like.
  it("never rewrites a drop onto a row", () => {
    const delegate = build({dropPosition: "on", key: "b", type: "item"});

    expect(delegate.getDropTargetFromPoint(0, 0, anything)).toEqual({
      dropPosition: "on",
      key: "b",
      type: "item",
    });
  });
});
