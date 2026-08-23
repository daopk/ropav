import type { DropTarget } from "@/utils/dnd-types";

import { afterEach, describe, expect, it } from "vitest";
import { shallowRef } from "vue";

import { ListDropTargetDelegate } from "@/utils/dnd-list-drop-target-delegate";

import { createFixtureCollection } from "../composables/dnd-collection-state-fixtures";

/**
 * Resolving a pointer position to a drop target.
 *
 * jsdom reports every rect as zero, so each row's geometry is stubbed. That is the whole input
 * to the algorithm — it reads rects and nothing else — so stubbing them tests the real thing
 * rather than a stand-in. Where a *real* layout matters (a genuine drag over a real list) the
 * coverage belongs in a browser test at the component level.
 */

const ROW_HEIGHT = 20;

/** A vertical stack of rows, each 20px tall, starting at y = 0. */
const renderList = (keys: string[], options: { width?: number; rowHeight?: number } = {}) => {
  const rowHeight = options.rowHeight ?? ROW_HEIGHT;
  const container = document.createElement("div");

  container.getBoundingClientRect = () =>
    ({
      bottom: keys.length * rowHeight,
      height: keys.length * rowHeight,
      left: 0,
      right: options.width ?? 100,
      top: 0,
      width: options.width ?? 100,
      x: 0,
      y: 0,
    }) as DOMRect;

  keys.forEach((key, index) => {
    const row = document.createElement("div");

    row.dataset["key"] = key;
    row.getBoundingClientRect = () =>
      ({
        bottom: (index + 1) * rowHeight,
        height: rowHeight,
        left: 0,
        right: options.width ?? 100,
        top: index * rowHeight,
        width: options.width ?? 100,
        x: 0,
        y: index * rowHeight,
      }) as DOMRect;
    container.appendChild(row);
  });

  document.body.appendChild(container);

  return container;
};

const acceptAll = () => true;
const rejectOn = (target: DropTarget) => !(target.type === "item" && target.dropPosition === "on");

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ListDropTargetDelegate", () => {
  const delegate = (keys: string[], container: HTMLElement) =>
    new ListDropTargetDelegate(
      createFixtureCollection(keys.map((key) => ({ key }))),
      shallowRef(container),
    );

  describe("an empty or absent collection", () => {
    it("reports the root when there is no container", () => {
      const target = new ListDropTargetDelegate(
        createFixtureCollection([{ key: "a" }]),
        shallowRef(null),
      );

      expect(target.getDropTargetFromPoint(0, 0, acceptAll)).toEqual({ type: "root" });
    });

    it("reports the root when the collection is empty", () => {
      const container = renderList([]);

      expect(delegate([], container).getDropTargetFromPoint(0, 5, acceptAll)).toEqual({
        type: "root",
      });
    });

    // A load-more sentinel carries no key; treating it as an item would crash the search.
    it("ignores rows that are not items", () => {
      const container = renderList(["a"]);
      const collection = createFixtureCollection([{ key: "a" }, { key: "loader", type: "loader" }]);
      const target = new ListDropTargetDelegate(collection, shallowRef(container));

      expect(target.getDropTargetFromPoint(0, 10, acceptAll)).toMatchObject({ key: "a" });
    });
  });

  describe("dropping on an item", () => {
    // The body of a row stays a drop-on target; only the edges mean "between".
    it("reports a drop on the item under the pointer", () => {
      const container = renderList(["a", "b", "c"]);

      expect(delegate(["a", "b", "c"], container).getDropTargetFromPoint(0, 30, acceptAll)).toEqual(
        { dropPosition: "on", key: "b", type: "item" },
      );
    });

    it("reports before within 5px of the leading edge", () => {
      const container = renderList(["a", "b", "c"]);

      expect(delegate(["a", "b", "c"], container).getDropTargetFromPoint(0, 22, acceptAll)).toEqual(
        { dropPosition: "before", key: "b", type: "item" },
      );
    });

    it("reports after within 5px of the trailing edge", () => {
      const container = renderList(["a", "b", "c"]);

      expect(delegate(["a", "b", "c"], container).getDropTargetFromPoint(0, 38, acceptAll)).toEqual(
        { dropPosition: "after", key: "b", type: "item" },
      );
    });
  });

  describe("when dropping on an item is refused", () => {
    /**
     * The 5px edge band is replaced by a midpoint split.
     *
     * With "on" unavailable, every pixel of the row has to resolve to one side or the other —
     * otherwise the middle of a row would be a dead zone with no valid target at all.
     */
    it("splits the item down the middle", () => {
      const container = renderList(["a", "b", "c"]);
      const target = delegate(["a", "b", "c"], container);

      expect(target.getDropTargetFromPoint(0, 24, rejectOn)).toEqual({
        dropPosition: "before",
        key: "b",
        type: "item",
      });
      expect(target.getDropTargetFromPoint(0, 36, rejectOn)).toEqual({
        dropPosition: "after",
        key: "b",
        type: "item",
      });
    });
  });

  describe("outside any item", () => {
    it("attaches before the first item when above the list", () => {
      const container = renderList(["a", "b"]);
      const collection = createFixtureCollection([{ key: "a" }, { key: "b" }]);
      const target = new ListDropTargetDelegate(collection, shallowRef(container));

      expect(target.getDropTargetFromPoint(0, -10, acceptAll)).toEqual({
        dropPosition: "before",
        key: "a",
        type: "item",
      });
    });

    it("attaches after the last item when below the list", () => {
      const container = renderList(["a", "b"]);

      expect(delegate(["a", "b"], container).getDropTargetFromPoint(0, 100, acceptAll)).toEqual({
        dropPosition: "after",
        key: "b",
        type: "item",
      });
    });
  });

  describe("finding the right row", () => {
    // The search bisects rather than scanning, so a long list is worth exercising end to end.
    it("resolves every row of a long list to itself", () => {
      const keys = Array.from({ length: 50 }, (_, index) => `row-${index}`);
      const container = renderList(keys);
      const target = delegate(keys, container);

      for (const index of [0, 1, 17, 33, 49]) {
        expect(target.getDropTargetFromPoint(0, index * ROW_HEIGHT + 10, acceptAll)).toEqual({
          dropPosition: "on",
          key: `row-${index}`,
          type: "item",
        });
      }
    });
  });

  describe("horizontal orientation", () => {
    const renderRow = (keys: string[]) => {
      const container = document.createElement("div");

      container.getBoundingClientRect = () =>
        ({
          bottom: 20,
          height: 20,
          left: 0,
          right: keys.length * 20,
          top: 0,
          width: keys.length * 20,
          x: 0,
          y: 0,
        }) as DOMRect;

      keys.forEach((key, index) => {
        const cell = document.createElement("div");

        cell.dataset["key"] = key;
        cell.getBoundingClientRect = () =>
          ({
            bottom: 20,
            height: 20,
            left: index * 20,
            right: (index + 1) * 20,
            top: 0,
            width: 20,
            x: index * 20,
            y: 0,
          }) as DOMRect;
        container.appendChild(cell);
      });

      document.body.appendChild(container);

      return container;
    };

    it("measures along the x axis", () => {
      const container = renderRow(["a", "b", "c"]);
      const target = new ListDropTargetDelegate(
        createFixtureCollection([{ key: "a" }, { key: "b" }, { key: "c" }]),
        shallowRef(container),
        { orientation: "horizontal" },
      );

      expect(target.getDropTargetFromPoint(30, 10, acceptAll)).toEqual({
        dropPosition: "on",
        key: "b",
        type: "item",
      });
    });

    // Right-to-left flips which edge means "before", so the visual order still reads correctly.
    it("flips before and after when the direction is rtl", () => {
      const container = renderRow(["a", "b", "c"]);
      const target = new ListDropTargetDelegate(
        createFixtureCollection([{ key: "a" }, { key: "b" }, { key: "c" }]),
        shallowRef(container),
        { direction: "rtl", orientation: "horizontal" },
      );

      expect(target.getDropTargetFromPoint(22, 10, acceptAll)).toEqual({
        dropPosition: "after",
        key: "b",
        type: "item",
      });
    });
  });

  describe("scoping to one collection", () => {
    /**
     * A nested collection's rows must not be mistaken for this one's.
     *
     * When the container declares `data-collection`, only rows carrying the same value are
     * measured — otherwise a table inside a list box would hand back keys the outer collection
     * has never heard of.
     */
    it("only measures rows belonging to the declared collection", () => {
      const container = renderList(["a", "b"]);

      container.dataset["collection"] = "outer";
      for (const row of container.querySelectorAll("[data-key]")) {
        (row as HTMLElement).dataset["collection"] = "outer";
      }

      const intruder = document.createElement("div");

      intruder.dataset["key"] = "a";
      intruder.dataset["collection"] = "inner";
      intruder.getBoundingClientRect = () =>
        ({
          bottom: 999,
          height: 999,
          left: 0,
          right: 100,
          top: 0,
          width: 100,
          x: 0,
          y: 0,
        }) as DOMRect;
      container.appendChild(intruder);

      expect(delegate(["a", "b"], container).getDropTargetFromPoint(0, 30, acceptAll)).toEqual({
        dropPosition: "on",
        key: "b",
        type: "item",
      });
    });
  });
});
