import type { VirtualizerTableCollection } from "@/utils/virtualizer-collection";
import type { VirtualizerLayoutHost, VirtualizerNode } from "@/utils/virtualizer-layout";
import type { VirtualizerKey } from "@/utils/virtualizer-layout-info";
import type { LayoutNode } from "@/utils/virtualizer-list-layout";

import { describe, expect, it } from "vitest";

import { createTableCollection } from "@/utils/virtualizer-collection";
import { Rect, Size } from "@/utils/virtualizer-geometry";
import { TableLayout } from "@/utils/virtualizer-table-layout";

const COLUMNS = ["name", "role", "email"];

/** The widths the story's three columns come to in a 700px box, as `buildColumnWidths` gives them. */
const WIDTHS = new Map<VirtualizerKey, number>([
  ["name", 230],
  ["role", 230],
  ["email", 240],
]);

const makeItems = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: index + 1, name: `Row ${index}` }));

interface SetUpOptions {
  columnKeys?: string[];
  columnWidths?: Map<VirtualizerKey, number>;
  hasLoader?: boolean;
  itemCount?: number;
  persistedKeys?: VirtualizerKey[];
  size?: Size;
  visibleRect?: Rect;
}

interface SetUpResult<L extends TableLayout> {
  collection: VirtualizerTableCollection;
  host: VirtualizerLayoutHost;
  layout: L;
  /** Run another pass, as the virtualizer does when something invalidated the layout. */
  update: (context?: { columnWidths?: Map<VirtualizerKey, number>; sizeChanged?: boolean }) => void;
}

const setUp = <L extends TableLayout>(layout: L, options: SetUpOptions = {}): SetUpResult<L> => {
  const persistedKeys = new Set(options.persistedKeys ?? []);
  const collection = createTableCollection({
    columnKeys: options.columnKeys ?? COLUMNS,
    hasLoader: options.hasLoader,
    idPrefix: "t",
    items: makeItems(options.itemCount ?? 0),
  });

  const host: VirtualizerLayoutHost = {
    collection,
    isPersistedKey: (key) => persistedKeys.has(key),
    persistedKeys,
    size: options.size ?? new Size(700, 500),
    visibleRect: options.visibleRect ?? new Rect(0, 0, 700, 500),
  };

  layout.host = host;

  const update: SetUpResult<L>["update"] = (context = {}) => {
    layout.update({
      layoutOptions: { columnWidths: context.columnWidths ?? options.columnWidths ?? WIDTHS },
      sizeChanged: context.sizeChanged,
    });
  };

  update();

  return { collection, host, layout, update };
};

const rectOf = (layout: TableLayout, key: VirtualizerKey) => layout.getLayoutInfo(key)?.rect;

const keysIn = (layout: TableLayout, rect: Rect) =>
  layout.getVisibleLayoutInfos(rect).map((layoutInfo) => layoutInfo.key);

const rowsIn = (layout: TableLayout, rect: Rect) =>
  layout
    .getVisibleLayoutInfos(rect)
    .filter((layoutInfo) => layoutInfo.type === "row")
    .map((layoutInfo) => layoutInfo.key);

describe("TableLayout", () => {
  describe("laying out the header", () => {
    it("stacks the header above the body and sticks it there", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 1000,
      });
      const header = layout.getLayoutInfo("t-header")!;

      expect(header.rect).toEqual(new Rect(0, 0, 700, 42));
      expect(header.isSticky).toBe(true);
      // Above the rows it stays in front of, and the only part of the table that is.
      expect(header.zIndex).toBe(1);
      expect(layout.getLayoutInfo("t-headerrow")?.rect).toEqual(new Rect(0, 0, 700, 42));
      expect(rectOf(layout, "t-body")).toEqual(new Rect(0, 42, 700, 42_000));
      // The header plus 1000 rows of 42.
      expect(layout.getContentSize()).toEqual(new Size(700, 42_042));
    });

    it("places each column at the running total of the widths it was given", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 3,
      });

      expect(rectOf(layout, "name")).toEqual(new Rect(0, 0, 230, 42));
      expect(rectOf(layout, "role")).toEqual(new Rect(230, 0, 230, 42));
      expect(rectOf(layout, "email")).toEqual(new Rect(460, 0, 240, 42));
    });

    it("stacks the columns back to front", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 3,
      });

      // Descending, so a column overlaps the one to its right rather than the other way round.
      expect(COLUMNS.map((key) => layout.getLayoutInfo(key)?.zIndex)).toEqual([4, 3, 2]);
    });

    it("gives a column with no width of its own no width at all", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        columnKeys: ["name", "unmeasured"],
        columnWidths: new Map([["name", 300]]),
        itemCount: 1,
      });

      expect(rectOf(layout, "unmeasured")).toEqual(new Rect(300, 0, 0, 42));
    });
  });

  describe("laying out a row", () => {
    it("puts each cell under its column and the row under the header", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 3,
      });

      expect(rectOf(layout, 1)).toEqual(new Rect(0, 42, 700, 42));
      expect(rectOf(layout, "1:name")).toEqual(new Rect(0, 42, 230, 42));
      expect(rectOf(layout, "1:role")).toEqual(new Rect(230, 42, 230, 42));
      expect(rectOf(layout, "1:email")).toEqual(new Rect(460, 42, 240, 42));
      expect(layout.getLayoutInfo("1:name")?.parentKey).toBe(1);
      expect(layout.getLayoutInfo(1)?.parentKey).toBe("t-body");
    });

    it("lets every part spill outside its own box", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 1,
      });

      // A focus ring is drawn with a shadow, which would be cut off by a wrapper that clips.
      expect(layout.getLayoutInfo(1)?.allowOverflow).toBe(true);
      expect(layout.getLayoutInfo("1:name")?.allowOverflow).toBe(true);
      expect(layout.getLayoutInfo("name")?.allowOverflow).toBe(true);
    });

    it("takes the row's width from the header rather than from its own cells", () => {
      // The columns come to 300 while the container is 700 wide, and the row follows the columns.
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        columnKeys: ["name"],
        columnWidths: new Map([["name", 300]]),
        itemCount: 2,
      });

      expect(rectOf(layout, "t-header")?.width).toBe(300);
      expect(rectOf(layout, 1)?.width).toBe(300);
      expect(layout.getContentSize()).toEqual(new Size(300, 126));
    });
  });

  describe("laying out lazily", () => {
    /** Counts how many rows were built, which is what makes the laziness observable. */
    class CountingTableLayout extends TableLayout {
      built: VirtualizerKey[] = [];

      protected override buildRow(node: VirtualizerNode, x: number, y: number): LayoutNode {
        this.built.push(node.key);

        return super.buildRow(node, x, y);
      }
    }

    it("builds a screenful of rows out of a thousand", () => {
      const { layout } = setUp(new CountingTableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 1000,
      });

      // The visible rectangle is 500 tall, so only what reaches it is built — not the 1000 rows
      // the scrollbar describes.
      expect(layout.built.length).toBeLessThan(20);
      expect(layout.getContentSize().height).toBe(42_042);
    });

    it("places a row it never built once it is asked about by key", () => {
      const { layout } = setUp(new CountingTableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 1000,
      });

      expect(layout.built).not.toContain(1000);
      // Pressing End asks about a row at an arbitrary offset, and there is no way to know where it
      // sits without laying out everything above it.
      expect(rectOf(layout, 1000)).toEqual(new Rect(0, 42 + 999 * 42, 700, 42));
    });
  });

  describe("choosing what is visible", () => {
    it("snaps the rectangle to whole rows, ignoring the gap", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 1000,
      });

      // 666.67 rounds up to 16 rows of 42, so the row starting exactly on the bottom edge still
      // counts — the search closes at the bottom and opens at the top.
      expect(rowsIn(layout, new Rect(0, 0, 700, 500 + 500 / 3))).toEqual(
        Array.from({ length: 16 }, (_, index) => index + 1),
      );
    });

    it("reports parents before children", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 2,
      });

      expect(keysIn(layout, new Rect(0, 0, 700, 500))).toEqual([
        "t-header",
        "t-headerrow",
        "name",
        "role",
        "email",
        "t-body",
        1,
        "1:name",
        "1:role",
        "1:email",
        2,
        "2:name",
        "2:role",
        "2:email",
      ]);
    });

    it("keeps the header in view once the rows have scrolled past it", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 1000,
      });
      const keys = keysIn(layout, new Rect(0, 5000, 700, 500));

      expect(keys).toContain("t-header");
      expect(keys).not.toContain(1);
      // Snapped back to 4998, which row 118 ends exactly on — and a row ending on the top edge
      // counts as being above the window, not in it.
      expect(rowsIn(layout, new Rect(0, 5000, 700, 500))[0]).toBe(119);
    });

    it("keeps a persisted row in view wherever it is", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 1000,
        persistedKeys: [1],
      });

      // The roving tab stop lives on the focused row; losing its element drops focus to the
      // document.
      expect(rowsIn(layout, new Rect(0, 5000, 700, 500))).toContain(1);
    });

    it("keeps the loading sentinel in view even at the top of the table", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        hasLoader: true,
        itemCount: 1000,
      });

      // A sentinel that is not in the DOM can never report that it came into view, so the next
      // page would never be asked for.
      expect(keysIn(layout, new Rect(0, 0, 700, 500))).toContain("t-loader");
      expect(rectOf(layout, "t-loader")).toEqual(new Rect(0, 42 + 1000 * 42, 700, 42));
    });
  });

  describe("an empty body", () => {
    it("fills the container so the empty state has somewhere to sit", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }));

      // Down to the bottom of the container rather than a container's worth below the header.
      expect(rectOf(layout, "t-body")).toEqual(new Rect(0, 42, 700, 458));
      expect(layout.getContentSize()).toEqual(new Size(700, 500));
    });
  });

  describe("changing the column widths", () => {
    it("moves every cell to the right of the one that changed", () => {
      const { layout, update } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 3,
      });

      expect(rectOf(layout, "1:role")).toEqual(new Rect(230, 42, 230, 42));

      update({
        columnWidths: new Map([
          ["name", 100],
          ["role", 230],
          ["email", 240],
        ]),
      });

      expect(rectOf(layout, "1:name")).toEqual(new Rect(0, 42, 100, 42));
      expect(rectOf(layout, "1:role")).toEqual(new Rect(100, 42, 230, 42));
      expect(rectOf(layout, "name")).toEqual(new Rect(0, 0, 100, 42));
      expect(layout.getContentSize().width).toBe(570);
    });

    it("asks to be laid out again only when a width really moved", () => {
      const layout = new TableLayout({ headingHeight: 42, rowHeight: 42 });
      const same = new Map(WIDTHS);

      expect(
        layout.shouldInvalidateLayoutOptions({ columnWidths: same }, { columnWidths: WIDTHS }),
      ).toBe(true);
      expect(
        layout.shouldInvalidateLayoutOptions({ columnWidths: WIDTHS }, { columnWidths: WIDTHS }),
      ).toBe(false);
    });
  });

  describe("rows of no declared height", () => {
    it("places every part at the fallback height and marks it an estimate", () => {
      const { layout } = setUp(new TableLayout(), { itemCount: 3 });

      expect(rectOf(layout, "t-header")).toEqual(new Rect(0, 0, 700, 48));
      expect(rectOf(layout, 1)).toEqual(new Rect(0, 48, 700, 48));
      expect(layout.getLayoutInfo("1:name")?.estimatedSize).toBe(true);
      expect(layout.getLayoutInfo("name")?.estimatedSize).toBe(true);
    });

    it("moves the rows below one whose cell measured taller", () => {
      const { layout, update } = setUp(new TableLayout(), { itemCount: 3 });

      expect(layout.updateItemSize?.("1:name", new Size(230, 80))).toBe(true);
      update();

      expect(rectOf(layout, 1)?.height).toBe(80);
      expect(rectOf(layout, 2)?.y).toBe(48 + 80);
      expect(layout.getLayoutInfo("1:name")?.estimatedSize).toBe(false);
    });

    it("reports a measurement that changed nothing", () => {
      const { layout } = setUp(new TableLayout(), { itemCount: 1 });

      expect(layout.updateItemSize?.("1:name", new Size(230, 48))).toBe(false);
      expect(layout.updateItemSize?.("nothing", new Size(230, 80))).toBe(false);
    });
  });
  /**
   * A table's rendered set holds the column headers and every cell as well as the rows, and a
   * cell shares its row's edges exactly — so the nearest-edge search inherited from the list
   * layout has to be told that only a row is somewhere a drop can land.
   */
  describe("drop targets", () => {
    const dropSetUp = (scrollTop = 0) =>
      setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 1000,
        visibleRect: new Rect(0, scrollTop, 700, 500),
      });

    const anything = () => true;

    // A row's key is the item's own; a cell's is `<row>:<column>`.
    it("names a row rather than one of its cells", () => {
      const { layout } = dropSetUp(21_000);

      expect(layout.getDropTargetFromPoint(10, 20, anything)).toEqual({
        dropPosition: "on",
        key: 500,
        type: "item",
      });
    });

    it("moves with the scroll offset", () => {
      const keys = [5_000, 21_000, 41_542].map((scrollTop) => {
        const target = dropSetUp(scrollTop).layout.getDropTargetFromPoint(10, 20, anything);

        return target?.type === "item" ? target.key : null;
      });

      expect(keys).toEqual([119, 500, 989]);
    });

    /**
     * The header floats above the rows at an offset the visible rectangle does not describe, so
     * near the top of the collection it is the nearest thing to the pointer — and it is what the
     * search names without the row filter, offering a drop into the header. A point over it is
     * not over anything droppable, which leaves the collection as a whole.
     */
    it("means the whole collection over the sticky header", () => {
      const { layout } = dropSetUp();

      expect(layout.getDropTargetFromPoint(10, 20, anything)).toEqual({ type: "root" });
      expect(layout.getDropTargetFromPoint(10, 60, anything)).toMatchObject({ key: 1 });
    });

    it("falls back to the whole collection when there are no rows", () => {
      const { layout } = setUp(new TableLayout({ headingHeight: 42, rowHeight: 42 }), {
        itemCount: 0,
      });

      expect(layout.getDropTargetFromPoint(10, 20, anything)).toEqual({ type: "root" });
    });

    /**
     * The gap belongs to the body, not to the table.
     *
     * Every wrapper is positioned against its parent, so an indicator without one would be
     * placed from the table's own origin and land under the sticky header.
     */
    it("hangs the indicator off the body", () => {
      const { collection, layout } = dropSetUp();
      const info = layout.getDropTargetLayoutInfo({ dropPosition: "before", key: 5, type: "item" });

      expect(info.parentKey).toBe(collection.bodyKey);
    });

    it("places the gap across the boundary between two rows", () => {
      const { layout } = dropSetUp();
      const rowRect = layout.getLayoutInfo(5)!.rect;

      expect(
        layout.getDropTargetLayoutInfo({ dropPosition: "before", key: 5, type: "item" }).rect,
      ).toEqual(new Rect(rowRect.x, rowRect.y - 1, rowRect.width, 2));
    });
  });
});
