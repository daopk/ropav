import type {
  TableColumnDefinition,
  UseTableColumnLayoutReturn,
} from "@/components/table/use-table-column-layout";

import { afterEach, describe, expect, it } from "vitest";
import { effectScope, shallowRef } from "vue";

import {
  buildColumnWidths,
  calculateColumnSizes,
  getMaxWidth,
  getMinWidth,
  isStaticWidth,
  parseFractionalUnit,
  parseStaticWidth,
  useTableColumnLayout,
} from "@/components/table/use-table-column-layout";

const scopes: (() => void)[] = [];

afterEach(() => {
  scopes.forEach((stop) => stop());
  scopes.length = 0;
});

const sizes = (
  tableWidth: number,
  columns: TableColumnDefinition[],
  changed: Map<string, number | string> = new Map(),
) =>
  calculateColumnSizes(
    tableWidth,
    columns,
    changed,
    () => "1fr",
    () => 75,
  );

const column = (key: string, props: Partial<TableColumnDefinition> = {}) => ({ key, ...props });

/** A layout over a fixed set of columns, in an owning scope so the watchers can be stopped. */
const setUp = (columns: TableColumnDefinition[], tableWidth = 1000) => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  const width = shallowRef(tableWidth);
  const layout = scope.run(() =>
    useTableColumnLayout({ columns: () => columns, tableWidth: width }),
  ) as UseTableColumnLayoutReturn;

  return { layout, width };
};

describe("useTableColumnLayout", () => {
  describe("parsing a width", () => {
    it.each([
      [150, true],
      ["50%", true],
      ["1fr", false],
      ["2fr", false],
      [undefined, false],
    ])("treats %s as static: %s", (width, expected) => {
      expect(isStaticWidth(width)).toBe(expected);
    });

    it("reads the number in front of fr", () => {
      expect(parseFractionalUnit("3fr")).toBe(3);
    });

    // React Aria warns and carries on rather than throwing, so an unrecognised width still lays out.
    it("falls back to one fraction for anything it cannot read", () => {
      expect(parseFractionalUnit("wide")).toBe(1);
      expect(parseFractionalUnit(200)).toBe(1);
    });

    it("resolves a percentage against the table width", () => {
      expect(parseStaticWidth("25%", 800)).toBe(200);
    });

    it("refuses a width that is neither pixels nor a percentage", () => {
      expect(() => parseStaticWidth("1fr", 800)).toThrow(/percentages or numbers/);
    });

    it("leaves a missing minimum at zero and a missing maximum unbounded", () => {
      expect(getMinWidth(undefined, 800)).toBe(0);
      expect(getMaxWidth(undefined, 800)).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe("dividing the table width", () => {
    it("splits it evenly between equal fractions", () => {
      expect(sizes(900, [column("a"), column("b"), column("c")])).toEqual([300, 300, 300]);
    });

    it("weights the split by each fraction", () => {
      expect(sizes(900, [column("a", { defaultWidth: "2fr" }), column("b")])).toEqual([600, 300]);
    });

    it("gives a static column its pixels and the rest to the fractions", () => {
      expect(sizes(1000, [column("a", { defaultWidth: 200 }), column("b"), column("c")])).toEqual([
        200, 400, 400,
      ]);
    });

    it("resolves a percentage column before dividing what is left", () => {
      expect(sizes(1000, [column("a", { defaultWidth: "20%" }), column("b")])).toEqual([200, 800]);
    });

    // The minimum is honoured first, then whatever is left is shared out again.
    it("holds a column at its minimum and redistributes the rest", () => {
      expect(sizes(400, [column("a", { minWidth: 300 }), column("b"), column("c")])).toEqual([
        300, 75, 75,
      ]);
    });

    it("holds a column at its maximum and gives the surplus to the others", () => {
      expect(sizes(900, [column("a", { maxWidth: 100 }), column("b"), column("c")])).toEqual([
        100, 400, 400,
      ]);
    });

    it("keeps every column at the default minimum of 75", () => {
      expect(sizes(100, [column("a"), column("b")])).toEqual([75, 75]);
    });

    // Rounding each column on its own would drift; the remainder is carried instead.
    it("sums to the table width even when the split does not divide evenly", () => {
      const result = sizes(1000, [column("a"), column("b"), column("c")]);

      expect(result.reduce((total, width) => total + width, 0)).toBe(1000);
      expect(result).toEqual([333, 334, 333]);
    });

    it("hands the sub-pixel remainder to the last column", () => {
      const result = sizes(900.5, [column("a"), column("b")]);

      expect(result).toEqual([450, 450.5]);
    });

    it("prefers a width already changed by a resize over the declared one", () => {
      const result = sizes(
        900,
        [column("a", { defaultWidth: "1fr" }), column("b")],
        new Map([["a", 600]]),
      );

      expect(result).toEqual([600, 300]);
    });
  });

  describe("building the column widths", () => {
    it("keys every column's width, falling back to a fraction and a 75px floor", () => {
      // `b` declares nothing, so it takes the `1fr` default; `c` is pushed to the 75px floor even
      // though an even three-way split would give it a third of 300.
      const widths = buildColumnWidths(300, [
        column("a", { width: 150 }),
        column("b"),
        column("c", { maxWidth: 20 }),
      ]);

      expect([...widths]).toEqual([
        ["a", 150],
        ["b", 75],
        ["c", 75],
      ]);
    });

    it("takes the overriding widths a resize in flight supplies", () => {
      const widths = buildColumnWidths(1000, [column("a"), column("b")], new Map([["a", 700]]));

      expect(widths.get("a")).toBe(700);
      expect(widths.get("b")).toBe(300);
    });

    it("takes the defaults it is given over its own", () => {
      const widths = buildColumnWidths(1000, [column("a"), column("b")], new Map(), {
        getDefaultWidth: (candidate) => (candidate.key === "a" ? 200 : "1fr"),
      });

      expect(widths.get("a")).toBe(200);
      expect(widths.get("b")).toBe(800);
    });

    it("agrees with the resizable layout on the same columns", () => {
      const columns = [column("a", { minWidth: 100 }), column("b"), column("c", { width: "20%" })];
      const { layout } = setUp(columns, 900);
      const widths = buildColumnWidths(900, columns);

      for (const { key } of columns) expect(widths.get(key)).toBe(layout.getColumnWidth(key));
    });
  });

  describe("reading the layout", () => {
    it("reports each column's width, minimum and maximum", () => {
      const { layout } = setUp([column("a", { maxWidth: 400, minWidth: 100 }), column("b")], 1000);

      expect(layout.getColumnWidth("a")).toBe(400);
      expect(layout.getColumnMinWidth("a")).toBe(100);
      expect(layout.getColumnMaxWidth("a")).toBe(400);
      expect(layout.getColumnMaxWidth("b")).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("lays out again when the table is resized", () => {
      const { layout, width } = setUp([column("a"), column("b")], 1000);

      expect(layout.getColumnWidth("a")).toBe(500);

      width.value = 600;

      expect(layout.getColumnWidth("a")).toBe(300);
    });

    it("reports nothing for a column it does not have", () => {
      const { layout } = setUp([column("a")]);

      expect(layout.getColumnWidth("missing")).toBe(0);
    });

    it("tracks which column is being dragged", () => {
      const { layout } = setUp([column("a")]);

      expect(layout.resizingColumn.value).toBeNull();

      layout.startResize("a");
      expect(layout.resizingColumn.value).toBe("a");

      layout.endResize();
      expect(layout.resizingColumn.value).toBeNull();
    });
  });

  describe("resizing a column", () => {
    it("applies the new width", () => {
      const { layout } = setUp([column("a"), column("b")], 1000);

      layout.updateResizedColumns("a", 300);

      expect(layout.getColumnWidth("a")).toBe(300);
      expect(layout.getColumnWidth("b")).toBe(700);
    });

    it("clamps the new width between the column's minimum and maximum", () => {
      const { layout } = setUp([column("a", { maxWidth: 400, minWidth: 200 }), column("b")], 1000);

      layout.updateResizedColumns("a", 50);
      expect(layout.getColumnWidth("a")).toBe(200);

      layout.updateResizedColumns("a", 900);
      expect(layout.getColumnWidth("a")).toBe(400);
    });

    /**
     * Everything left of the dragged edge is pinned at the pixels it already has. Without that the
     * whole table reflows under the pointer, because the columns to the left are still fractions.
     */
    it("freezes the columns to the left at their current pixel width", () => {
      const { layout } = setUp([column("a"), column("b"), column("c")], 900);

      const result = layout.updateResizedColumns("b", 200);

      expect(result.get("a")).toBe(300);
      expect(result.get("b")).toBe(200);
      // Only the columns to the right are still fractions, so they absorb the difference.
      expect(result.get("c")).toBe("1fr");
      expect(layout.getColumnWidth("c")).toBe(400);
    });

    it("leaves a width the caller controls alone", () => {
      const { layout } = setUp([column("a"), column("b", { width: 300 })], 1000);

      layout.updateResizedColumns("a", 500);

      expect(layout.getColumnWidth("a")).toBe(500);
      expect(layout.getColumnWidth("b")).toBe(300);
    });

    it("keeps the resized width across a table resize", () => {
      const { layout, width } = setUp([column("a"), column("b")], 1000);

      layout.updateResizedColumns("a", 300);
      width.value = 800;

      expect(layout.getColumnWidth("a")).toBe(300);
      expect(layout.getColumnWidth("b")).toBe(500);
    });
  });
});
