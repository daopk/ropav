import type {DropTarget} from "@/utils/dnd-types";

import {describe, expect, it} from "vitest";

import {navigateDropTarget} from "@/utils/dnd-drop-target-navigation";

import {
  createFixtureCollection,
  createFixtureKeyboardDelegate,
} from "../composables/dnd-collection-state-fixtures";

/**
 * Walking the drop target with the arrow keys.
 *
 * A pointer picks a position directly; a keyboard has to reach every one of them in turn. Within
 * an item the walk visits before → on → after, and at the edges of a subtree it descends into
 * children or climbs back out — so most of what is pinned here is tree traversal, not key
 * handling.
 */

const flat = createFixtureCollection([{key: "a"}, {key: "b"}, {key: "c"}]);

/** A folder holding two children, followed by a top-level sibling. */
const tree = createFixtureCollection([
  {key: "folder"},
  {key: "child-1", parentKey: "folder"},
  {key: "child-2", parentKey: "folder"},
  {key: "after"},
]);

const item = (key: string, dropPosition: "after" | "before" | "on"): DropTarget => ({
  dropPosition,
  key,
  type: "item",
});

const down = (collection: typeof flat, target: DropTarget | null, wrap = false) =>
  navigateDropTarget(
    createFixtureKeyboardDelegate(collection),
    collection,
    target,
    "down",
    false,
    wrap,
  );

const up = (collection: typeof flat, target: DropTarget | null, wrap = false) =>
  navigateDropTarget(
    createFixtureKeyboardDelegate(collection),
    collection,
    target,
    "up",
    false,
    wrap,
  );

describe("navigateDropTarget", () => {
  describe("starting out", () => {
    it("starts at the root when there is no target yet", () => {
      expect(down(flat, null)).toEqual({type: "root"});
    });

    it("moves from the root to before the first item", () => {
      expect(down(flat, {type: "root"})).toEqual(item("a", "before"));
    });

    it("moves backwards from nothing to after the last item", () => {
      expect(up(flat, null)).toEqual(item("c", "after"));
    });
  });

  describe("walking a flat list forwards", () => {
    // Every position within an item is reachable, in visual order.
    it("visits before, then on, then after within one item", () => {
      expect(down(flat, item("a", "before"))).toEqual(item("a", "on"));
      expect(down(flat, item("a", "on"))).toEqual(item("b", "before"));
    });

    /**
     * "After a" and "before b" are the same gap, so only one of the two names is offered.
     *
     * Emitting both would make the user press the key twice to cross a single position.
     */
    it("does not offer the same gap twice", () => {
      expect(down(flat, item("a", "on"))).toEqual(item("b", "before"));
    });

    it("reaches after the last item at the end", () => {
      expect(down(flat, item("c", "on"))).toEqual(item("c", "after"));
    });

    it("stops at the end when not wrapping", () => {
      expect(down(flat, item("c", "after"))).toBeNull();
    });

    it("wraps through the root when asked to", () => {
      expect(down(flat, item("c", "after"), true)).toEqual({type: "root"});
    });
  });

  describe("walking a flat list backwards", () => {
    it("visits after, then on, then before within one item", () => {
      expect(up(flat, item("c", "after"))).toEqual(item("c", "on"));
      expect(up(flat, item("c", "on"))).toEqual(item("c", "before"));
    });

    it("steps to the item above", () => {
      expect(up(flat, item("c", "before"))).toEqual(item("b", "on"));
    });

    it("reaches the root from the top", () => {
      expect(up(flat, item("a", "before"))).toEqual({type: "root"});
    });
  });

  describe("descending into a subtree", () => {
    /**
     * The children come before the folder's own "after" position.
     *
     * Otherwise a keyboard user would step straight past an expanded folder and could never
     * drop anything inside it.
     */
    it("enters the children rather than skipping to after the folder", () => {
      expect(down(tree, item("folder", "on"))).toEqual(item("child-1", "before"));
    });

    it("walks the children in order", () => {
      expect(down(tree, item("child-1", "on"))).toEqual(item("child-2", "before"));
    });

    /**
     * Leaving the last child climbs out to the parent's level.
     *
     * `child-2` has no next sibling, so the walk continues at whatever follows the folder —
     * here the top-level `after` item.
     */
    it("climbs out of the subtree after the last child", () => {
      expect(down(tree, item("child-2", "after"))).toEqual(item("after", "before"));
    });
  });

  describe("climbing back out backwards", () => {
    /**
     * Moving up into a folder lands after its last child, not on the folder itself.
     *
     * A subtree is entered from its end when walking backwards, mirroring how it is entered
     * from its start when walking forwards.
     */
    it("enters a subtree from its end", () => {
      expect(up(tree, item("after", "before"))).toEqual(item("child-2", "after"));
    });

    it("steps back through the children", () => {
      expect(up(tree, item("child-2", "before"))).toEqual(item("child-1", "on"));
    });
  });

  describe("rows that are not items", () => {
    // A loader row is not somewhere a drop can land, so the walk steps over it.
    it("skips over a loader row", () => {
      const withLoader = createFixtureCollection([
        {key: "a"},
        {key: "loader", type: "loader"},
        {key: "b"},
      ]);

      expect(down(withLoader, item("a", "on"))).toEqual(item("b", "before"));
    });
  });

  describe("horizontal movement", () => {
    // Left and right swap roles under a right-to-left reading direction.
    it("treats right as forwards and left as backwards in ltr", () => {
      const delegate = createFixtureKeyboardDelegate(flat);

      expect(navigateDropTarget(delegate, flat, item("a", "before"), "right")).toEqual(
        item("a", "on"),
      );
      expect(navigateDropTarget(delegate, flat, item("a", "on"), "left")).toEqual(
        item("a", "before"),
      );
    });

    it("swaps them under rtl", () => {
      const delegate = createFixtureKeyboardDelegate(flat);

      expect(navigateDropTarget(delegate, flat, item("a", "before"), "left", true)).toEqual(
        item("a", "on"),
      );
      expect(navigateDropTarget(delegate, flat, item("a", "on"), "right", true)).toEqual(
        item("a", "before"),
      );
    });
  });

  describe("a delegate that skips keys", () => {
    /**
     * A grid's delegate moves down a column, not to the next key in document order.
     *
     * When it lands somewhere other than the immediate next item, the walk jumps there keeping
     * the current position rather than cycling through before/on/after where it stands.
     */
    it("jumps to the delegate's key keeping the same position", () => {
      const grid = createFixtureCollection([{key: "a"}, {key: "b"}, {key: "c"}, {key: "d"}]);
      const columnDelegate = {
        getFirstKey: () => "a",
        // Two columns: below "a" is "c".
        getKeyBelow: (key: string | number) => (key === "a" ? "c" : null),
        getLastKey: () => "d",
      };

      expect(navigateDropTarget(columnDelegate, grid, item("a", "before"), "down")).toEqual(
        item("c", "before"),
      );
    });
  });
});
